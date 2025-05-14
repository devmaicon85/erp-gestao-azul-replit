import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}

export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateTime(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const numericOnly = phone.replace(/\D/g, '');
  
  // Format based on length (10 or 11 digits)
  if (numericOnly.length === 11) {
    // Format as (XX) XXXXX-XXXX
    return `(${numericOnly.substring(0, 2)}) ${numericOnly.substring(2, 7)}-${numericOnly.substring(7)}`;
  } else if (numericOnly.length === 10) {
    // Format as (XX) XXXX-XXXX
    return `(${numericOnly.substring(0, 2)}) ${numericOnly.substring(2, 6)}-${numericOnly.substring(6)}`;
  }
  
  // Return original if not matching expected format
  return phone;
}

export function formatDocument(document: string): string {
  if (!document) return '';
  
  // Remove non-numeric characters
  const numericOnly = document.replace(/\D/g, '');
  
  // Format as CPF (###.###.###-##) if 11 digits
  if (numericOnly.length === 11) {
    return `${numericOnly.substring(0, 3)}.${numericOnly.substring(3, 6)}.${numericOnly.substring(6, 9)}-${numericOnly.substring(9)}`;
  }
  
  // Format as CNPJ (##.###.###/####-##) if 14 digits
  if (numericOnly.length === 14) {
    return `${numericOnly.substring(0, 2)}.${numericOnly.substring(2, 5)}.${numericOnly.substring(5, 8)}/${numericOnly.substring(8, 12)}-${numericOnly.substring(12)}`;
  }
  
  // Return original if not matching expected format
  return document;
}

export function generateInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800';
    case 'DELIVERING':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-primary-100 text-primary-800';
    case 'CANCELED':
      return 'bg-red-100 text-red-800';
    case 'OPEN':
      return 'bg-blue-100 text-blue-800';
    case 'PARTIAL_RECEIVED':
      return 'bg-yellow-100 text-yellow-800';
    case 'RECEIVED':
      return 'bg-green-100 text-green-800';
    case 'OVERDUE':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'NEW': return "Novo";
    case 'DELIVERING': return "Entregando";
    case 'DELIVERED': return "Entregue";
    case 'COMPLETED': return "Concluído";
    case 'CANCELED': return "Cancelado";
    case 'OPEN': return "Em Aberto";
    case 'PARTIAL_RECEIVED': return "Recebido Parcialmente";
    case 'RECEIVED': return "Recebido";
    case 'OVERDUE': return "Vencido";
    default: return status;
  }
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

export function formatZipCode(zipCode: string): string {
  if (!zipCode) return '';
  
  // Remove non-numeric characters
  const numericOnly = zipCode.replace(/\D/g, '');
  
  // Format as #####-###
  if (numericOnly.length === 8) {
    return `${numericOnly.substring(0, 5)}-${numericOnly.substring(5)}`;
  }
  
  return zipCode;
}

export async function fetchAddressByZipCode(zipCode: string) {
  if (!zipCode || zipCode.length < 8) return null;
  
  const cepClean = zipCode.replace(/\D/g, '');
  
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
    const data = await response.json();
    
    if (data.erro) return null;
    
    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      complement: data.complemento,
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}
