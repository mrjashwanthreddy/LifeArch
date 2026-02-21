# 🏛️ LifeArch

<!-- Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21"/>
  <img src="https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" alt="Spring Boot 3.5"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="MIT License"/>
</p>

<p align="center">
  <strong>Your life, architected.</strong> — A full-stack productivity platform for managing tasks, projects, and recurring events with a beautiful calendar interface.
</p>

---

## 📖 Description

**LifeArch** is a modern, full-stack personal productivity application that helps you structure your daily life with clarity and purpose. It combines project management, task tracking, subtasks, comments, and a powerful recurring-event calendar into a single, cohesive workspace.

Unlike generic to-do apps, LifeArch is built with **first-class support for recurring tasks** (powered by the iCalendar RRULE standard), drag-and-drop project boards, and a real-time calendar view — all protected by a stateless JWT authentication system.

**The problem it solves:** Most productivity tools force you to choose between a simple list and a full project suite. LifeArch bridges both: lightweight enough for daily tasks, powerful enough for complex projects with grouped task boards.

---

## 🖼️ Visuals

> Screenshots will be added once the application is deployed. Below are the key views:

| View                                            | Description                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| ![Dashboard](docs/screenshots/dashboard.png)    | **Dashboard** — Your starred tasks, upcoming deadlines, and project list at a glance. |
| ![Calendar View](docs/screenshots/calendar.png) | **Calendar View** — Month/week/day views with recurring task expansion.               |
| ![Project Board](docs/screenshots/project.png)  | **Project Board** — Drag-and-drop Kanban-style task groups within a project.          |

> 📌 _Add your own screenshots to `docs/screenshots/` and update the paths above._

---

## ✨ Feature Highlights

- 🔐 **Secure JWT Authentication** — Stateless, token-based auth with Spring Security. Registration and login with BCrypt password hashing.
- 📋 **Task Management** — Create, update, prioritize, star, and delete tasks with rich details (due date & time, notes, priority levels).
- 🔁 **Recurring Tasks (iCal RRULE)** — Define complex recurring schedules (daily, weekly, monthly, custom). Each occurrence is independently tracked.
- ✅ **Subtasks & Comments** — Break tasks into subtasks with individual completion tracking; add threaded comments for context.
- 📂 **Project & Task Groups** — Organize tasks into color-coded projects, further structured into named task groups (Kanban columns).
- 🗓️ **Interactive Calendar** — FullCalendar-powered day/week/month toggle with RRULE expansion, rendered directly from the backend.
- 🚀 **Drag & Drop Board** — Reorder and move tasks across groups using `@hello-pangea/dnd`.
- 🗃️ **Database Migrations** — Schema versioned and automatically migrated with Flyway.
- 📚 **API Documentation** — Built-in Swagger UI via SpringDoc OpenAPI at `/swagger-ui.html`.
- ⚡ **Reactive Frontend** — TanStack Query for server-state management, Zustand for client-state, Zod + React Hook Form for validation.

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed on your machine:

| Tool           | Version                       |
| -------------- | ----------------------------- |
| **Java JDK**   | 21+                           |
| **Maven**      | 3.9+ (or use included `mvnw`) |
| **Node.js**    | 18+                           |
| **npm**        | 9+                            |
| **PostgreSQL** | 14+                           |

---

### 🛠️ Backend Setup

**1. Clone the repository:**

```bash
git clone https://github.com/mrjashwanthreddy/LifeArch.git
cd LifeArch
```

**2. Create the PostgreSQL database:**

```sql
CREATE DATABASE lifearch;
```

**3. Configure environment variables:**

Copy the example env file and fill in your credentials:

```bash
# life-arch-backend/.env
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=your_password
SPRING_SECURITY_PASSWORD=your_security_password
JWT_SECRET_KEY=your_256bit_hex_secret_key
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

To generate a secure JWT secret key (256-bit hex):

```bash
openssl rand -hex 32
```

**4. Run the backend:**

```bash
cd life-arch-backend
./mvnw spring-boot:run
```

The backend will start on **`http://localhost:8080`**. Flyway will automatically run database migrations on startup.

**5. Verify the API is running:**

Open your browser at: [`http://localhost:8080/swagger-ui.html`](http://localhost:8080/swagger-ui.html)

---

### 🎨 Frontend Setup

**1. Navigate to the frontend directory:**

```bash
cd life-arch-frontend
```

**2. Install dependencies:**

```bash
npm install
```

**3. Configure the API base URL:**

Create a `.env` file in `life-arch-frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

**4. Start the development server:**

```bash
npm run dev
```

The frontend will be available at **`http://localhost:5173`**.

---

## 💡 Usage

### Register & Login

Navigate to `http://localhost:5173/register` to create an account, then login at `/login`.  
All subsequent requests are authenticated via a JWT token stored in the browser.

### Creating a Task

```
Dashboard → "Add Task" button
→ Fill in title, due date, priority, notes
→ Optional: Set an RRULE for recurrence (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)
→ Save
```

### Creating a Project with Task Groups (Kanban)

```
Dashboard → "New Project"
→ Give it a name and color
→ Inside the project, add Task Groups (e.g., "To Do", "In Progress", "Done")
→ Add tasks directly into groups
→ Drag & drop tasks between groups
```

### Calendar View

Navigate to **`/app/calendar`**.  
The calendar fetches all tasks (including recurring expansions) for the visible date range from the backend.

### API Examples (via cURL)

**Register:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jashwanth","email":"user@example.com","password":"secret123"}'
```

**Login:**

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'
# Returns: { "token": "eyJhbGci..." }
```

**Create a Task:**

```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Morning Run","priority":"P1","dueDatetime":"2026-02-22T07:00:00Z","rrule":"FREQ=DAILY"}'
```

**Get Calendar Tasks:**

```bash
curl "http://localhost:8080/api/v1/tasks/calendar?from=2026-02-01T00:00:00Z&to=2026-02-28T23:59:59Z" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## 🛠️ Technologies Used

### Backend

| Technology                                                                                                  | Purpose                                     |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=flat&logo=spring-boot)             | Core application framework                  |
| ![Spring Security](https://img.shields.io/badge/Spring_Security-6-6DB33F?style=flat&logo=spring)            | Authentication & authorization              |
| ![Spring Data JPA](https://img.shields.io/badge/Spring_Data_JPA-3.5-6DB33F?style=flat&logo=spring)          | ORM and repository layer                    |
| ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white) | Relational database                         |
| ![Flyway](https://img.shields.io/badge/Flyway-10-CC0200?style=flat&logo=flyway)                             | Database schema migrations                  |
| ![JJWT](https://img.shields.io/badge/JJWT-0.11.5-black?style=flat)                                          | JSON Web Token generation & validation      |
| ![iCal4j](https://img.shields.io/badge/iCal4j-3.2-blue?style=flat)                                          | iCalendar RRULE parsing for recurring tasks |
| ![Lombok](https://img.shields.io/badge/Lombok-latest-red?style=flat)                                        | Boilerplate reduction                       |
| ![SpringDoc OpenAPI](https://img.shields.io/badge/SpringDoc_OpenAPI-2.3-85EA2D?style=flat)                  | Swagger UI & API docs                       |

### Frontend

| Technology                                                                                                        | Purpose                           |
| ----------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| ![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)                      | UI component library              |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat&logo=typescript&logoColor=white)      | Type-safe JavaScript              |
| ![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat&logo=vite&logoColor=white)                          | Build tool & dev server           |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white) | Utility-first CSS framework       |
| ![TanStack Query](https://img.shields.io/badge/TanStack_Query-5-FF4154?style=flat)                                | Server-state management & caching |
| ![Zustand](https://img.shields.io/badge/Zustand-5-brown?style=flat)                                               | Client-side state management      |
| ![FullCalendar](https://img.shields.io/badge/FullCalendar-6-blue?style=flat)                                      | Interactive calendar component    |
| ![React Hook Form](https://img.shields.io/badge/React_Hook_Form-7-EC5990?style=flat)                              | Performant form management        |
| ![Zod](https://img.shields.io/badge/Zod-4-3068B7?style=flat)                                                      | Schema-based validation           |
| ![Axios](https://img.shields.io/badge/Axios-1.13-5A29E4?style=flat&logo=axios)                                    | HTTP client                       |
| ![@hello-pangea/dnd](https://img.shields.io/badge/@hello--pangea/dnd-18-black?style=flat)                         | Drag & drop interactions          |

---

## 🤝 Contributing

Contributions are welcome and greatly appreciated! Here's how to get started:

1. **Fork** this repository.
2. **Create** your feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit** your changes with a descriptive message:
   ```bash
   git commit -m 'feat: add habit tracker module'
   ```
4. **Push** to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request** against the `main` branch.

### Contribution Guidelines

- Follow existing code style and package structure conventions.
- Backend: Java code should follow standard Spring patterns. New modules go under `life.arch.<module>`.
- Frontend: New pages go in `src/pages/`, shared components in `src/components/`.
- All new API endpoints should be documented via SpringDoc annotations.
- Write clear PR descriptions explaining the **what** and **why** of your change.

> 📄 For more detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md) _(coming soon)_.

---

## 📜 License

This project is licensed under the **MIT License** — you are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, provided the original copyright notice is included.

See the [LICENSE](LICENSE) file for the full license text.

---

## 👤 Contact & Authors

**Jashwanth Reddy**

- GitHub: [@mrjashwanthreddy](https://github.com/mrjashwanthreddy)
- Repository: [LifeArch](https://github.com/mrjashwanthreddy/LifeArch)

> 💬 For bugs, feature requests, or questions, please [open an issue](https://github.com/mrjashwanthreddy/LifeArch/issues) on GitHub.

---

## 🙏 Acknowledgments

- [Spring Boot](https://spring.io/projects/spring-boot) — For making Java backend development a joy.
- [FullCalendar](https://fullcalendar.io/) — For its incredible, extensible calendar component.
- [iCal4j](https://www.ical4j.org/) — For robust iCalendar RRULE parsing in Java.
- [ULID Creator](https://github.com/f4b6a3/ulid-creator) — For sortable, UUID-compatible identifiers.
- [TanStack Query](https://tanstack.com/query) — For dramatically simplifying server-state management.
- [Shields.io](https://shields.io/) — For the beautiful README badges.

---

<p align="center">Built with ❤️ by Jashwanth Reddy &mdash; 2026</p>
