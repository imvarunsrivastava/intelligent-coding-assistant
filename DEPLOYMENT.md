# Deployment Guide

This guide covers different deployment options for the Intelligent Coding Assistant.

## 🚀 Quick Deployment

### Local Development
```bash
# 1. Setup
./scripts/setup.sh

# 2. Start services
./scripts/start.sh
```

### Docker Deployment
```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps
```

## 🏗️ Production Deployment

### Prerequisites
- Docker and Docker Compose
- Domain name (for HTTPS)
- SSL certificates
- API keys (OpenAI/Anthropic)

### Environment Configuration

1. **Create production environment file**:
   ```bash
   cp .env.example .env.production
   ```

2. **Configure production settings**:
   ```env
   # API Keys
   OPENAI_API_KEY=your_production_openai_key
   ANTHROPIC_API_KEY=your_production_anthropic_key
   
   # Security
   SECRET_KEY=your_super_secure_secret_key_here
   DEBUG=false
   
   # Database URLs
   QDRANT_URL=http://qdrant:6333
   REDIS_URL=redis://redis:6379
   
   # CORS (restrict to your domain)
   CORS_ORIGINS=https://yourdomain.com
   
   # Rate limiting
   RATE_LIMIT_REQUESTS=1000
   RATE_LIMIT_WINDOW=3600
   ```

### Docker Production Setup

1. **Create production docker-compose file**:
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   
   services:
     qdrant:
       image: qdrant/qdrant:latest
       volumes:
         - qdrant_data:/qdrant/storage
       restart: unless-stopped
       
     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data
       command: redis-server --appendonly yes
       restart: unless-stopped
       
     backend:
       build: ./backend
       env_file: .env.production
       depends_on:
         - qdrant
         - redis
       restart: unless-stopped
       
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
         - ./nginx/ssl:/etc/nginx/ssl:ro
       depends_on:
         - backend
       restart: unless-stopped
   
   volumes:
     qdrant_data:
     redis_data:
   ```

2. **Deploy**:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Nginx Configuration

Create `nginx/nginx.conf`:
```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }
    
    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name yourdomain.com;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        
        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # WebSocket
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
        }
    }
}
```

## ☁️ Cloud Deployment

### AWS Deployment

1. **ECS with Fargate**:
   ```bash
   # Build and push to ECR
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
   
   docker build -t intelligent-coding-assistant ./backend
   docker tag intelligent-coding-assistant:latest <account>.dkr.ecr.us-east-1.amazonaws.com/intelligent-coding-assistant:latest
   docker push <account>.dkr.ecr.us-east-1.amazonaws.com/intelligent-coding-assistant:latest
   ```

2. **Create ECS task definition**:
   ```json
   {
     "family": "intelligent-coding-assistant",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "1024",
     "memory": "2048",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "<account>.dkr.ecr.us-east-1.amazonaws.com/intelligent-coding-assistant:latest",
         "portMappings": [
           {
             "containerPort": 8000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "QDRANT_URL",
             "value": "http://qdrant:6333"
           }
         ],
         "secrets": [
           {
             "name": "OPENAI_API_KEY",
             "valueFrom": "arn:aws:secretsmanager:us-east-1:<account>:secret:openai-api-key"
           }
         ]
       }
     ]
   }
   ```

### Google Cloud Platform

1. **Cloud Run deployment**:
   ```bash
   # Build and deploy
   gcloud builds submit --tag gcr.io/PROJECT_ID/intelligent-coding-assistant ./backend
   
   gcloud run deploy intelligent-coding-assistant \
     --image gcr.io/PROJECT_ID/intelligent-coding-assistant \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars QDRANT_URL=http://qdrant:6333 \
     --set-secrets OPENAI_API_KEY=openai-key:latest
   ```

### Azure Container Instances

1. **Deploy with Azure CLI**:
   ```bash
   az container create \
     --resource-group myResourceGroup \
     --name intelligent-coding-assistant \
     --image myregistry.azurecr.io/intelligent-coding-assistant:latest \
     --cpu 2 \
     --memory 4 \
     --ports 8000 \
     --environment-variables QDRANT_URL=http://qdrant:6333 \
     --secure-environment-variables OPENAI_API_KEY=your_key_here
   ```

## 🔧 Kubernetes Deployment

### Kubernetes Manifests

1. **Namespace**:
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: intelligent-coding-assistant
   ```

2. **ConfigMap**:
   ```yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: app-config
     namespace: intelligent-coding-assistant
   data:
     QDRANT_URL: "http://qdrant:6333"
     REDIS_URL: "redis://redis:6379"
     DEBUG: "false"
   ```

3. **Secret**:
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: app-secrets
     namespace: intelligent-coding-assistant
   type: Opaque
   data:
     OPENAI_API_KEY: <base64-encoded-key>
     ANTHROPIC_API_KEY: <base64-encoded-key>
     SECRET_KEY: <base64-encoded-secret>
   ```

4. **Deployment**:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: backend
     namespace: intelligent-coding-assistant
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: backend
     template:
       metadata:
         labels:
           app: backend
       spec:
         containers:
         - name: backend
           image: intelligent-coding-assistant:latest
           ports:
           - containerPort: 8000
           envFrom:
           - configMapRef:
               name: app-config
           - secretRef:
               name: app-secrets
           resources:
             requests:
               memory: "1Gi"
               cpu: "500m"
             limits:
               memory: "2Gi"
               cpu: "1000m"
   ```

5. **Service**:
   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: backend-service
     namespace: intelligent-coding-assistant
   spec:
     selector:
       app: backend
     ports:
     - port: 80
       targetPort: 8000
     type: LoadBalancer
   ```

### Deploy to Kubernetes

```bash
kubectl apply -f k8s/
```

## 📊 Monitoring and Logging

### Health Checks

The application provides health check endpoints:
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health with dependencies

### Logging

Configure structured logging:
```python
# In your .env
LOG_LEVEL=info
LOG_FORMAT=json
```

### Metrics

Enable Prometheus metrics:
```python
# In your .env
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Monitoring Stack

Deploy monitoring with Docker Compose:
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

## 🔒 Security Considerations

### API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs
- Use secure API keys storage

### Container Security
- Use non-root user in containers
- Scan images for vulnerabilities
- Keep base images updated
- Use secrets management

### Network Security
- Use private networks
- Implement firewall rules
- Monitor network traffic
- Use VPN for admin access

## 🚨 Troubleshooting

### Common Issues

1. **Backend not starting**:
   ```bash
   # Check logs
   docker-compose logs backend
   
   # Check environment variables
   docker-compose exec backend env
   ```

2. **Database connection issues**:
   ```bash
   # Test Qdrant connection
   curl http://localhost:6333/health
   
   # Test Redis connection
   redis-cli ping
   ```

3. **VS Code extension not connecting**:
   - Check backend URL in settings
   - Verify CORS configuration
   - Check network connectivity

### Performance Tuning

1. **Backend optimization**:
   - Increase worker processes
   - Configure connection pooling
   - Enable caching
   - Optimize model parameters

2. **Database optimization**:
   - Configure Qdrant memory settings
   - Optimize Redis persistence
   - Monitor resource usage

3. **Network optimization**:
   - Use CDN for static assets
   - Enable compression
   - Optimize WebSocket connections

## 📈 Scaling

### Horizontal Scaling
- Use load balancer
- Scale backend replicas
- Implement session affinity for WebSocket

### Vertical Scaling
- Increase CPU/memory resources
- Optimize model loading
- Use GPU acceleration if available

### Database Scaling
- Use Qdrant clustering
- Implement Redis clustering
- Consider read replicas
