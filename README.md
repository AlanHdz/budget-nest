# Gestor de Finanzas Personales - API

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![Swagger](https://img.shields.io/badge/-Swagger-%2385EA2D?style=for-the-badge&logo=swagger&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens)

API RESTful construida con **NestJS** y **Prisma** para gestionar finanzas personales. Permite a los usuarios registrarse, administrar múltiples tipos de cuentas (débito, crédito, efectivo e inversiones) y registrar ingresos y gastos asociados a categorías personalizadas.

---

## ✨ Características Principales

* **🔐 Autenticación de Usuarios:** Registro e inicio de sesión seguro utilizando **JSON Web Tokens (JWT)**.
* **👤 Gestión de Cuentas:** Funcionalidad CRUD completa para cuentas de usuario.
    * **Tipos de cuenta:** `DEBITO`, `CREDITO`, `EFECTIVO`, `INVERSIONES`.
* **💸 Registro de Transacciones:** Creación y gestión de ingresos y gastos asociados a una cuenta.
* **📊 Gestión de Categorías:** Funcionalidad CRUD para categorías, que pueden ser de tipo `INGRESO` o `GASTO`.
* **📈 Dashboard Analítico:** Endpoints diseñados para alimentar un dashboard con:
    * Últimos movimientos (transacciones recientes).
    * Resumen total de ingresos y gastos.
    * Desglose de ingresos y gastos por categoría.
    * Resumen financiero mensual.
* **📖 Documentación de API Protegida:** Interfaz de **Swagger** para visualizar y probar los endpoints de manera interactiva, protegida con autenticación básica.

---

## 🛠️ Tecnologías Utilizadas

* **Framework:** [NestJS](https://nestjs.com/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Base de Datos:** PostgreSQL (o la base de datos que hayas configurado)
* **Autenticación:** [Passport.js](http://www.passportjs.org/) con estrategia JWT
* **Validación:** `class-validator` y `class-transformer`
* **Documentación:** `Swagger (OpenAPI)`

---

## 🚀 Cómo Empezar

Sigue estos pasos para tener una copia del proyecto corriendo localmente.

### Prerrequisitos

* Node.js (v18 o superior)
* npm, pnpm o yarn
* Una instancia de base de datos (ej. PostgreSQL, MySQL) corriendo.

### Instalación

1.  **Clona el repositorio**
    ```sh
    git clone [https://github.com/tu-usuario/tu-repositorio.git](https://github.com/tu-usuario/tu-repositorio.git)
    cd tu-repositorio
    ```

2.  **Instala las dependencias**
    ```sh
    npm install
    ```

3.  **Configura las variables de entorno**
    Crea un archivo `.env` en la raíz del proyecto y copia el contenido de `.env.example` (si lo tienes) o añade las siguientes variables:

    ```ini
    # Ver la tabla de abajo para más detalles
    DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"
    JWT_SECRET="tu_secreto_para_jwt"
    PORT=3000
    SWAGGER_USER=admin
    SWAGGER_PASSWORD=tu_contraseña_segura
    ```

4.  **Aplica las migraciones de la base de datos**
    Este comando creará las tablas en tu base de datos basándose en el schema de Prisma.
    ```sh
    npx prisma migrate dev
    ```

5.  **Inicia la aplicación en modo de desarrollo**
    ```sh
    npm run start:dev
    ```
    El servidor estará disponible en `http://localhost:3000`.

---

## ⚙️ Variables de Entorno

Estas son las variables necesarias para que la aplicación funcione correctamente.

| Variable           | Descripción                                                | Ejemplo                                                     |
| ------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| `DATABASE_URL`     | La URL de conexión para que Prisma se conecte a la BD.     | `postgresql://user:pass@host:5432/db?schema=public`         |
| `JWT_SECRET`       | Cadena de texto secreta para firmar los JSON Web Tokens.   | `un-secreto-muy-largo-y-dificil-de-adivinar`                |
| `PORT`             | El puerto en el que correrá el servidor de la aplicación.    | `3000`                                                      |
| `SWAGGER_USER`     | El nombre de usuario para acceder a la documentación API.    | `admin`                                                     |
| `SWAGGER_PASSWORD` | La contraseña para acceder a la documentación API.           | `micontraseña123`                                           |

---

## 📚 Documentación de la API

Una vez que la aplicación esté corriendo, puedes acceder a la documentación interactiva de Swagger en la siguiente ruta:

**URL:** [http://localhost:3000/api/docs](http://localhost:3000/api/docs)

Se te pedirá un usuario y una contraseña para poder acceder. Utiliza las credenciales que definiste en las variables de entorno `SWAGGER_USER` y `SWAGGER_PASSWORD`.