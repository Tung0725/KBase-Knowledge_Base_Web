# KBase - Knowledge Base System

![License](https://img.shields.io/badge/license-MIT-blue)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.x-green)
![Java](https://img.shields.io/badge/Java-17+-orange)

**KBase** is a modern, feature-rich Knowledge Base Management System built with **Spring Boot** and **Vue.js**. It provides a centralized platform for storing, searching, and managing technical and business knowledge.

## ✨ Features

### 🗄️ Content Management

- **Multi-format Support**: Create articles using rich text editor with Markdown support
- **Categorization**: Organize knowledge with nested categories (up to 4 levels)
- **Tagging System**: Flexible tagging for cross-referencing content
- **Version History**: Track changes with detailed revision history
- **Draft & Publish**: Workflow for content creation and release
- **Attachments**: Upload and manage file attachments (PDF, Images, Office docs)

### 🔍 Search & Discovery

- **Full-text Search**: Advanced search across all content
- **Fuzzy Search**: Find relevant results even with typos
- **Search Suggestions**: Real-time suggestions as you type
- **Filter Options**: Filter by category, tags, author, date, and status

### 🔐 Security & Access Control

- **Role-based Access Control (RBAC)**:
  - **Super Admin**: Full system access
  - **Editor**: Create and manage content
  - **Viewer**: Read-only access
- **Login & Authentication**: Secure authentication system
- **Password Reset**: Email-based password recovery

### 🎨 User Interface

- **Modern Design**: Clean and responsive user interface
- **Dark Mode**: Eye-friendly dark theme
- **Customizable**: Brand colors and logo support
- **Responsive**: Optimized for desktop, tablet, and mobile

### 🛠️ Administration

- **System Settings**: Configure application parameters
- **User Management**: Manage user accounts and roles
- **Audit Logs**: Track important system activities
- **Backup & Restore**: Database backup and recovery features

### 📊 Analytics

- **View Statistics**: Track article views and engagement
- **Popular Content**: Identify trending and frequently accessed articles
- **User Activity**: Monitor user contributions and interactions

## 🏗️ Architecture

KBase follows a **clean architecture** with distinct layers:

```
┌─────────────────────────────────────────────────┐
│                 Frontend (Vue.js)                │
│  UI Components · Routing · State Management     │
├─────────────────────────────────────────────────┤
│                  REST API Layer                 │
│   Controllers · Request Validation · API Gateway │
├─────────────────────────────────────────────────┤
│              Business Logic Layer               │
│  Services · Domain Entities · Use Cases       │
├─────────────────────────────────────────────────┤
│                 Data Access Layer               │
│  Repositories · JPA · Database (MySQL)          │
└─────────────────────────────────────────────────┘
```

### Technology Stack

#### Backend

- **Framework**: Spring Boot 3.2.x
- **Language**: Java 17+
- **Database**: MySQL 8.0+
- **ORM**: Spring Data JPA with Hibernate
- **Security**: Spring Security with JWT
- **API Documentation**: SpringDoc OpenAPI (Swagger)
- **Validation**: Jakarta Bean Validation

#### Frontend

- **Framework**: Vue.js 3
- **Language**: JavaScript (ES6+)
- **Styling**: SCSS/SASS
- **UI Components**: Element Plus
- **HTTP Client**: Axios

### Folder Structure

```
kbase/
├── src/
│   ├── main/java/com/kbase/
│   │   ├── config/          # Configuration files
│   │   ├── controller/      # REST API controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── entity/          # JPA entities
│   │   ├── exception/       # Custom exceptions
│   │   ├── repository/      # Data access layer
│   │   ├── service/         # Business logic
│   │   ├── security/        # Security configurations
│   │   └── util/            # Utility classes
│   └── main/resources/      # Resources and configs
├── kbase-web/             # Vue.js frontend
└── kbase-vue/
    ├── src/
    │   ├── api/             # API configuration
    │   ├── assets/          # Static assets
    │   ├── components/      # Vue components
    │   ├── router/          # Vue Router config
    │   ├── store/           # Vuex store
    │   ├── styles/          # Global styles
    │   └── views/           # Page components
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Java 17** or higher
- **MySQL 8.0** or higher
- **Node.js 16** or higher
- **npm** or **yarn**

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/your-username/kbase.git
cd kbase
```

#### 2. Backend Setup

**Configure Database**
Update `src/main/resources/application.properties` with your MySQL credentials:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/kbase?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=your_username
spring.datasource.password=your_password
```

**Build and Run**
```bash
./mvnw spring-boot:run
```
The backend will start on `http://localhost:8080`.

#### 3. Frontend Setup

Navigate to the frontend directory:
```bash
cd kbase-vue
npm install
# or
yarn install
```

**Configure API URL**
In `kbase-vue/src/api/axios.js`, update the API base URL if needed:
```javascript
const API_BASE_URL = 'http://localhost:8080/api';
```

**Run the Frontend**
```bash
npm run serve
# or
yarn serve
```
The frontend will be accessible at `http://localhost:9527`.

## 📂 Project Structure

### Backend (`src/main/java/com/kbase`)

- **config/**: Application configuration (security, database, etc.)
- **controller/**: REST API endpoints
- **dto/**: Data Transfer Objects for API communication
- **entity/**: JPA entity classes
- **exception/**: Custom exception classes and global exception handler
- **repository/**: Data access layer (Spring Data JPA repositories)
- **service/**: Business logic layer
- **security/**: Authentication and authorization configurations
- **util/**: Utility helper classes

### Frontend (`kbase-vue`)

- **src/api/**: API request configurations
- **src/assets/**: Static assets (images, fonts, etc.)
- **src/components/**: Reusable UI components
- **src/router/**: Vue Router route configurations
- **src/store/**: Vuex store modules
- **src/styles/**: Global styles and SCSS variables
- **src/views/**: Page-level components

## 🔧 Configuration

### Application Properties

Location: `src/main/resources/application.properties`

Key configuration parameters:

```properties
# Server port
server.port=8080

# Database configuration
spring.datasource.url=jdbc:mysql://localhost:3306/kbase?useSSL=false&serverTimezone=UTC
spring.datasource.username=kbase_user
spring.datasource.password=password

# Hibernate/JPA configuration
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect

# JWT configuration
jwt.secret=your-secret-key
jwt.expiration=86400

# Email configuration (for password reset)
spring.mail.host