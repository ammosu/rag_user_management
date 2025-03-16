# RAG System with LLM Routing

This project is a RAG (Retrieval-Augmented Generation) system with intelligent LLM routing capabilities. It integrates with various language models and provides a unified API for querying them.

## Features

- **Authentication System**: JWT-based authentication with SSO support
- **LLM Integration**: Support for multiple language models (OpenAI, Anthropic, local models)
- **Intelligent Model Routing**: Route queries to the most appropriate model based on content, cost, user role, etc.
- **RAG Capabilities**: Retrieve relevant documents and use them as context for LLM queries
- **OpenAI Compatible API**: API endpoints compatible with the OpenAI API format
- **API Key Management**: Generate and manage API keys for programmatic access

## Architecture

The system consists of the following components:

- **Authentication Services**: Handle user authentication and authorization
- **Model Services**: Manage language models and routing rules
- **LLM Clients**: Interface with different language model providers
- **Query Classifier**: Analyze queries to determine their characteristics
- **Retrieval Service**: Retrieve relevant documents from the knowledge base
- **API Endpoints**: Provide access to the system's functionality

## API Endpoints

### Authentication

- `POST /api/auth/login`: Log in with email and password
- `POST /api/auth/register`: Register a new user
- `GET /api/auth/profile`: Get the current user's profile

### API Keys

- `GET /api/auth/api-keys`: Get the current user's API keys
- `POST /api/auth/api-keys`: Generate a new API key
- `DELETE /api/auth/api-keys/:id`: Revoke an API key

### RAG

- `POST /api/rag/query`: Execute a RAG query
- `GET /api/rag/models`: Get available models for RAG queries

### Model Management (Admin Only)

- `GET /api/model-manager/models`: Get all models
- `GET /api/model-manager/models/active`: Get active models
- `GET /api/model-manager/models/:id`: Get a specific model
- `POST /api/model-manager/models`: Create a new model
- `PUT /api/model-manager/models/:id`: Update a model
- `DELETE /api/model-manager/models/:id`: Delete a model
- `PATCH /api/model-manager/models/:id/active`: Toggle a model's active status

### Routing Rules (Admin Only)

- `GET /api/model-manager/routing-rules`: Get all routing rules
- `GET /api/model-manager/routing-rules/active`: Get active routing rules
- `POST /api/model-manager/routing-rules`: Create a new routing rule
- `PUT /api/model-manager/routing-rules/:id`: Update a routing rule
- `DELETE /api/model-manager/routing-rules/:id`: Delete a routing rule
- `PATCH /api/model-manager/routing-rules/:id/active`: Toggle a routing rule's active status

### OpenAI Compatible API

- `POST /v1/chat/completions`: Chat completions API
- `POST /v1/completions`: Completions API
- `GET /v1/models`: List available models
- `GET /v1/models/:model`: Get model information

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Set up environment variables:
   ```
   cp .env.example .env
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Start the frontend:
   ```
   cd frontend
   npm start
   ```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGO_URL`: MongoDB connection URL
- `JWT_SECRET`: Secret for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key

## License

This project is licensed under the MIT License.
