![][image1]

**PROJECT DOCUMENT**

**AI ENGINEER INTERNSHIP PROGRAM**

&nbsp;

Internship Program — Position: AI Engineer  •  Duration: 3 months (12 weeks)

**Final Project: TBD** *(to be confirmed)*

&nbsp;

**Table of Contents**

[**1\. Objectives and Scope	3**](#heading=)

[**2\. Functional Requirements	3**](#heading=)

[**3\. Non-Functional Requirements	3**](#heading=)

[**4\. High-Level Architecture	3**](#heading=)

[**5\. Recommended Tech Stack (2026)	3**](#heading=)

[**6\. Database Schema Design	4**](#heading=)

[**7\. Technical Pipeline (For AI Intern)	4**](#heading=)

[**8\. Prompt Engineering & Guardrails	4**](#heading=)

[**9\. MLOps / DevOps	4**](#heading=)

[**10\. 3-Month (12-Week) Implementation Roadmap	4**](#heading=)

[**PHASE 1: TECHNOLOGY FOUNDATIONS (Week 1 – 4\)	5**](#phase-1:-technology-foundations-\(week-1-–-4\))

[Week 1 — Backend Foundations: Node.js	5](#heading=)

[Week 2 — Frontend Foundations & Full-Stack Integration: ReactJS	5](#heading=)

[Week 3 — AI Foundations: LLM & Basic RAG	5](#heading=)

[Week 4 — Advanced AI Foundations: LangGraph & Agentic Workflow	6](#heading=)

[**PHASE 2: REAL PROJECT IMPLEMENTATION (Week 5 – 12\)	7**](#phase-2:-real-project-implementation-\(week-5-–-12\))

[Week 5 — Project Architecture & Official Setup	7](#heading=)

[Week 6 — Backend Core Development	7](#heading=)

[Week 7 — AI Data Ingestion Pipeline	7](#heading=)

[Week 8 — AI Engine Integration with Backend	7](#heading=)

[Week 9 — Improving Retrieval Quality: Hybrid Search & Reranking	8](#heading=)

[Week 10 — Improving Generation Quality: Guardrails & Citations	8](#heading=)

[Week 11 — Testing, Optimization & MLOps	8](#heading=)

[Week 12 — Documentation & Final Report	8](#heading=)

[**11\. Go-Live Checklist	9**](#heading=)

# **1\. Objectives and Scope**

**TBD** *— To be defined once the final project is confirmed.*

# **2\. Functional Requirements**

**TBD** *— To be defined once the final project is confirmed.*

# **3\. Non-Functional Requirements**

**TBD** *— To be defined once the final project is confirmed.*

# **4\. High-Level Architecture**

Client–Server model combined with an AI Microservice:

* Client Layer: Web interface. Communicates with the Backend via a RESTful API.

* Core Backend Layer: Responsible for Auth, database CRUD, and calling the AI Service.

* AI Engine Layer: Receives the query from the Backend, performs Retrieval from the Vector DB, assembles the prompt, calls the LLM, then returns the result to the Backend.

*This is the default reference architecture for the internship program; it will be adjusted once the final project (TBD) is confirmed.*

# **5\. Recommended Tech Stack (2026)**

The technologies below follow current trends — easy to adopt, yet solid enough for a production environment:

**Frontend**

* ReactJS combined with TailwindCSS.

* Recommended to use a ready-made UI library (such as shadcn/ui) to save development time.

**Backend**

* Node.js (NestJS or Express.js framework) to ensure the API handles load well, speeds up development, and keeps the language consistent (JavaScript/TypeScript) with the Frontend.

* Recommended to use TypeScript to improve type-safety when working with more complex schemas (e.g., structured metadata, embeddings).

**AI & Pipeline Orchestration**

* Python (FastAPI). Use LangGraph to manage complex RAG flows (agentic workflows) instead of standard LangChain.

**Database**

* Relational DB: PostgreSQL.

* Vector DB: use the pgvector extension installed directly on PostgreSQL to store metadata and vector embeddings in one place, reducing complexity for the intern.

**LLM & Embeddings**

* Use the OpenAI API (GPT-4o-mini) in the early stage to keep the focus on logic.

* Local/Test environment: Ollama or vLLM can be used to run open-source models (Llama 3, Qwen) to save on cost.

*This is the default recommended stack for the internship program; specific choices will be revisited once the final project (TBD) is confirmed.*

# **6\. Database Schema Design**

**TBD** *— To be defined once the final project is confirmed.*

# **7\. Technical Pipeline (For AI Intern)**

**TBD** *— To be defined once the final project is confirmed.*

# **8\. Prompt Engineering & Guardrails**

**TBD** *— To be defined once the final project is confirmed.*

# **9\. MLOps / DevOps**

* Containerize the entire application with Docker (docker-compose covering FE, BE, AI Service, PostgreSQL).

* Manage source code via Git/GitHub; interns are required to follow the Pull Request (PR) and Code Review workflow.

*This is the default MLOps/DevOps setup for the internship program; specifics (e.g., CI/CD, deployment target) will be defined once the final project (TBD) is confirmed.*

# **10\. 3-Month (12-Week) Implementation Roadmap**

Accelerated track (Principal): the roadmap is divided into two main phases: Phase 1 (Weeks 1–4, 1 month) — a condensed review of foundational technologies (Node.js, ReactJS, LLM, LangGraph) for candidates who already have a strong base, and Phase 2 (Weeks 5–12, 2 months) — implement the actual final project (TBD) in greater depth, with the last week dedicated to wrap-up and reporting.

# **PHASE 1: TECHNOLOGY FOUNDATIONS (Week 1 – 4\)** {#phase-1:-technology-foundations-(week-1-–-4)}

## **Week 1 — Backend Foundations: Node.js**

**Content**

* Company onboarding; introduction to the internship program and overall objectives

* Node.js core: Event Loop, Async/Await, Module system

* Build a basic REST API with Express.js or NestJS

* TypeScript basics: type, interface, generic

* Connect to PostgreSQL using an ORM (TypeORM/Prisma)

* Authentication/Authorization (JWT, role-based access)

* Standardized database schema design, writing migrations

* Validation, error handling, and logging in Node.js

* Introduction to Docker & Docker Compose for the dev environment

**Deliverable**

* Simple CRUD mini API (e.g., user management) using Node.js \+ TypeScript \+ PostgreSQL

* Mini API with complete Auth, packaged and run via Docker Compose

## **Week 2 — Frontend Foundations & Full-Stack Integration: ReactJS**

**Content**

* ReactJS core: Component, Props, State, Hooks (useState, useEffect)

* Advanced state management (Context API or basic Zustand/Redux)

* TailwindCSS and a UI library (e.g., shadcn/ui)

* Calling APIs from the frontend (Axios/Fetch), handling loading/error states

* Routing (React Router), route protection by role (Admin/User)

* Connect the frontend to the backend API built in Week 1 (Auth, CRUD)

* Basic responsive design (mobile-friendly)

**Deliverable**

* Static mini Chat UI (not yet connected to AI) showing a message list, able to send sample messages

* Small full-stack demo: Login → view data list → CRUD from the UI, running on both the Node.js backend and ReactJS frontend

## **Week 3 — AI Foundations: LLM & Basic RAG**

**Content**

* LLM concepts, basic prompt engineering

* Introduction to RAG: Embedding, Vector Database, Retrieval, Generation

* Hands-on: call the OpenAI API (GPT-4o-mini), write simple prompts

* Set up pgvector; practice storing and querying basic vectors

**Deliverable**

* Simple Python RAG demo script: read a text file, chunk, embed, query, and answer a basic question

## **Week 4 — Advanced AI Foundations: LangGraph & Agentic Workflow**

**Content**

* Introduction to LangGraph: Node, Edge, and State concepts in agentic workflows

* Comparing LangGraph with traditional LangChain

* Hands-on: build a simple RAG workflow with LangGraph (Retrieval node → Generation node)

* Review and consolidate 4 weeks of learning with the mentor

**Deliverable**

* Basic RAG pipeline demo running on LangGraph (Hybrid Search/Reranking not yet integrated)

* Phase 1 wrap-up review session with the mentor

# 

# **PHASE 2: REAL PROJECT IMPLEMENTATION (Week 5 – 12\)** {#phase-2:-real-project-implementation-(week-5-–-12)}

*Note: the detailed content below will be adapted once the final project (TBD) is confirmed; the structure shown reflects the general shape each week is expected to follow.*

## **Week 5 — Project Architecture & Official Setup**

**Content**

* Apply the knowledge learned to formally design the database schema and API spec for the final project (TBD)

* Set up the official repository (Git/GitHub flow, PR, code review)

* Backend: set up the official Node.js project (NestJS/Express) for the project

* Frontend: set up the official ReactJS project for the project

**Deliverable**

* Official project repository, architecture documentation & API spec

## **Week 6 — Backend Core Development**

**Content**

* Backend: Auth, chat/session management, and document/data management (CRUD) as applicable to the final project

* Frontend: scaffold the Chat UI \+ Admin Dashboard shell

**Deliverable**

* Core backend module completed (Auth, session & document management)

## **Week 7 — AI Data Ingestion Pipeline**

**Content**

* AI: build the real ingestion pipeline for the project's data (parsing, chunking, embedding) — specifics TBD based on the final project's data domain

* Store processed data and embeddings in the vector database

**Deliverable**

* Ingestion pipeline running end-to-end on real project data

## **Week 8 — AI Engine Integration with Backend**

**Content**

* Build the AI Service (FastAPI) using LangGraph for the RAG flow

* Connect the Node.js backend with the AI Service

* Complete the basic end-to-end chat flow (FE → BE → AI → BE → FE)

**Deliverable**

* Working end-to-end chat flow demo with basic source citations

## **Week 9 — Improving Retrieval Quality: Hybrid Search & Reranking**

**Content**

* Apply Hybrid Search (BM25 \+ Vector Similarity), if applicable to the final project

* Integrate reranking (Cross-Encoder/BGE-Reranker), if applicable

**Deliverable**

* Retrieval pipeline upgraded: Hybrid Search → Reranking, with measurably more relevant results

## **Week 10 — Improving Generation Quality: Guardrails & Citations**

**Content**

* Refine prompts and guardrails (anti-hallucination, prompt injection prevention)

* Finalize detailed citation/source-referencing features

**Deliverable**

* Complete generation pipeline with guardrails and detailed citations (scope TBD based on final project)

## **Week 11 — Testing, Optimization & MLOps**

**Content**

* Containerize the whole system with Docker (Docker Compose: FE, BE, AI Service, PostgreSQL)

* Test edge cases; measure and optimize latency (\< 5 seconds)

* Test robustness against hallucination/incorrect output; verify mobile responsiveness

* Code cleanup and bug fixing

**Deliverable**

* System running stably via Docker Compose; test & optimization report

## **Week 12 — Documentation & Final Report**

**Content**

* Review the go-live checklist

* Write API documentation (Swagger) and README.md

* Prepare a wrap-up report: lessons learned, challenges, takeaways, and improvement suggestions

* Prepare a final product demo slide deck

**Deliverable**

* Complete API Docs \+ README.md

* Wrap-up report \+ demo slide deck (10–15 slides)

# **11\. Go-Live Checklist**

*The checklist below is a general template; specific items will be finalized once the final project (TBD) is confirmed.*

* ☐  Database is properly indexed for performance (e.g., HNSW index for pgvector, if applicable to the final project).

* ☐  Robustness tested against edge cases / failure scenarios relevant to the final project (TBD).

* ☐  Interface works well on both desktop and mobile devices.

* ☐  API Docs (Swagger) and README.md completed for the project.

[image1]: <data:image/png;base64,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>