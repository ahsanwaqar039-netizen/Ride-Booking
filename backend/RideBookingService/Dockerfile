FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["RideBookingService.csproj", "."]
RUN dotnet restore "./RideBookingService.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "RideBookingService.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RideBookingService.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RideBookingService.dll"]