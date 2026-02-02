# Ride Booking App (InDrive Clone)

A full-stack ride-booking application inspired by InDrive, featuring real-time location tracking, fare negotiation, and an AI-powered fare suggestion service.

## 🚀 Key Features

- **Real-time Tracking**: Live driver and rider location updates using SignalR.
- **Fare Negotiation**: Riders and drivers can negotiate fares in real-time.
- **AI Fare Suggestion**: Python service that suggests optimal fares based on distance and demand.
- **Authentication**: Secure JWT-based authentication for Riders, Drivers, and Admins.
- **Live Chat**: Real-time communication between rider and driver.
- **Admin Dashboard**: Comprehensive management of rides, users, and ratings.
- **Dockerized Setup**: Easy deployment using Docker Compose.

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, Tailwind CSS, Leaflet/Mapbox for mapping.
- **Backend**: .NET 8.0 Web API, Entity Framework Core, SignalR.
- **Database**: PostgreSQL (via Docker).
- **AI Service**: Python (FastAPI/Flask) for fare estimation.
- **DevOps**: Docker & Docker Compose.

## 📁 Project Structure

```text
├── frontend/             # Next.js web application
├── backend/              # .NET 8 Core Web API
├── ai-service/           # Python fare suggestion service
├── docker-compose.yml    # Configuration for all services
└── .gitignore            # Git exclusion rules
```

## 🚥 Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/) (optional, for local development)
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (optional, for local development)

### Running with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/ahsanwaqar039-netizen/Ride-Booking.git
   cd Ride-Booking
   ```

2. Start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - AI Service: `http://localhost:8000`

## 📄 License

This project is open-source and available under the MIT License.
