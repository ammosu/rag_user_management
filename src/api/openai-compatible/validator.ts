// Validation functions for OpenAI compatible API requests

export function validateChatCompletionsRequest(body: any): string | null {
  // Check if body is an object
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }
  
  // Check if messages array exists and is not empty
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return 'messages is required and must be a non-empty array';
  }
  
  // Check if each message has role and content
  for (const message of body.messages) {
    if (!message.role) {
      return 'Each message must have a role';
    }
    
    if (!['system', 'user', 'assistant', 'function', 'tool'].includes(message.role)) {
      return `Invalid message role: ${message.role}`;
    }
    
    if (message.content === undefined && message.role !== 'function' && message.role !== 'tool') {
      return 'Each message must have content';
    }
  }
  
  // Check if at least one user message exists
  if (!body.messages.some((m: any) => m.role === 'user')) {
    return 'At least one user message is required';
  }
  
  // Check temperature if provided
  if (body.temperature !== undefined && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) {
    return 'temperature must be a number between 0 and 2';
  }
  
  // Check max_tokens if provided
  if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || body.max_tokens <= 0)) {
    return 'max_tokens must be a positive number';
  }
  
  return null; // No validation errors
}

export function validateCompletionsRequest(body: any): string | null {
  // Check if body is an object
  if (!body || typeof body !== 'object') {
    return 'Request body must be a JSON object';
  }
  
  // Check if prompt exists
  if (!body.prompt) {
    return 'prompt is required';
  }
  
  // Check temperature if provided
  if (body.temperature !== undefined && (typeof body.temperature !== 'number' || body.temperature < 0 || body.temperature > 2)) {
    return 'temperature must be a number between 0 and 2';
  }
  
  // Check max_tokens if provided
  if (body.max_tokens !== undefined && (typeof body.max_tokens !== 'number' || body.max_tokens <= 0)) {
    return 'max_tokens must be a positive number';
  }
  
  return null; // No validation errors
}
