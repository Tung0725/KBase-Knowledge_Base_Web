### Prepare for TRAINING

**Deadline**: 27/09/2026

**KBase - Knowledge Base**

## 🎯 1. What We're Building
A project knowledge base system where teams can store and manage project information. Team members can upload project documents (guides, specs, meeting notes), videos (recordings, tutorials), and other files.

Optionally, add an AI chatbot to help quickly find information by answering questions about stored content.

### What You'll Learn:
- **Backend**: Build REST APIs with Java Spring Boot (authentication, file upload, API docs with Swagger)
- **Frontend**: Create web pages with React or Next.js (upload files, dashboards, search)
- **Storage**: Use PostgreSQL for data, MinIO or S3 for files
- **Deployment**: Deploy with Docker, AWS, or other platforms
- **Optional Features**: AI chatbot (Python), Terraform/Terragrunt, Kubernetes

---

## 📝 2. Main Features

### 2.1 User Accounts
- Sign up and log in with email
- Three user types:
  - **Admin**: Manages all users and projects
  - **Owner**: Creates projects, invites team members
  - **User**: Uploads documents, asks chatbot questions

### 2.2 Projects
- Owners create projects
- Invite team members to join
- Each user can join multiple projects

### 2.3 Document Storage
- Upload files: PDF, Word (DOCX, DOC), Excel (XLSX, XLS), PowerPoint (PPTX, PPT), Markdown, TXT
- Upload images: JPG, PNG, GIF, SVG, BMP
- Upload videos: MP4, MOV, AVI
- Organize documents by project
- View and download files

### 2.4 AI Chatbot (Optional)
- Ask questions about uploaded documents
- Get answers with references to source files
- Works across all documents in a project

---

## 🏗️ 3. Technical Parts

### 📱 3.1 Frontend - React.js or Next.js (Optional)
**Tools:** React/Next.js, TypeScript, Tailwind CSS

**What you'll build:**
- Login and signup pages
- Project dashboard (create, view, manage projects)
- File upload page (drag and drop files)
- Document browser and search
- Chat interface to talk with AI (if using optional AI feature)

**Skills:** Build web pages, connect to backend, design UI, routing

### ⚙️ 3.2 Backend - Java Spring Boot
**Tools:** Spring Boot, Spring Data JPA, Spring Web MVC, Spring Security, PostgreSQL, Swagger/OpenAPI

**What you'll build:**
- REST API endpoints for all features
- User authentication and authorization (JWT tokens)
- User management (create, update, delete accounts)
- Project management (create projects, add members)
- File upload handling (save files, store metadata)
- API documentation with Swagger UI
- Optional: Connect to AI chatbot

**Skills:** Build REST APIs, implement security, work with databases, document APIs

### 💾 3.3 Storage - PostgreSQL & MinIO
**Tools:** PostgreSQL, MinIO (or S3)

**What you'll set up:**
- PostgreSQL: Store user accounts, projects, file metadata
- MinIO (or S3): Store uploaded files and videos
- Database design (users, projects, documents, permissions)
- File storage integration (upload, download, organize)

**Skills:** Database design, object storage, data management

### 🤖 3.4 AI Part - Python (Optional)
**Tools:** Python, LangChain, OpenAI or Hugging Face

**What you'll build:**
- Read text from PDF and documents
- Convert videos to text (speech-to-text)
- Store document content in a searchable format
- Answer questions by finding relevant information
- Generate smart responses

**Skills:** Work with AI, process documents, build chatbots

---

## ☁️ 4. Deployment - Docker / AWS / Other
**Tools:** Docker, AWS (or other cloud platforms), Terraform (optional), Kubernetes (optional)

**What you'll set up:**
- Package apps in Docker containers
- Deploy to cloud (AWS, Azure, GCP, or local server)
- Set up PostgreSQL database (RDS, managed, or self-hosted)
- Set up file storage (MinIO, S3, or local storage)
- (Advanced) Automate setup with Terraform/Terragrunt
- (Advanced) Manage containers with Kubernetes