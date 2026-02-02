
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using RideBookingService.Data;

#nullable disable

namespace RideBookingService.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260128103536_InitialRideBookingFlow")]
    partial class InitialRideBookingFlow
    {
        /// <inheritdoc />
        protected override void BuildTargetModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "8.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("RideBookingService.Models.Rating", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("Comment")
                        .HasColumnType("text");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int>("FromUserId")
                        .HasColumnType("integer");

                    b.Property<int>("RideId")
                        .HasColumnType("integer");

                    b.Property<int>("Score")
                        .HasColumnType("integer");

                    b.Property<int>("ToUserId")
                        .HasColumnType("integer");

                    b.HasKey("Id");

                    b.HasIndex("RideId");

                    b.ToTable("Ratings");
                });

            modelBuilder.Entity("RideBookingService.Models.Ride", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<decimal?>("AcceptedFare")
                        .HasColumnType("numeric");

                    b.Property<DateTime?>("CompletedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<double?>("DistanceKm")
                        .HasColumnType("double precision");

                    b.Property<int?>("DriverId")
                        .HasColumnType("integer");

                    b.Property<string>("DropoffAddress")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<double>("DropoffLatitude")
                        .HasColumnType("double precision");

                    b.Property<double>("DropoffLongitude")
                        .HasColumnType("double precision");

                    b.Property<decimal>("OfferedFare")
                        .HasColumnType("numeric");

                    b.Property<string>("PickupAddress")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<double>("PickupLatitude")
                        .HasColumnType("double precision");

                    b.Property<double>("PickupLongitude")
                        .HasColumnType("double precision");

                    b.Property<int>("RiderId")
                        .HasColumnType("integer");

                    b.Property<DateTime?>("StartedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<decimal?>("SuggestedMaxFare")
                        .HasColumnType("numeric");

                    b.Property<decimal?>("SuggestedMinFare")
                        .HasColumnType("numeric");

                    b.HasKey("Id");

                    b.HasIndex("DriverId");

                    b.HasIndex("RiderId");

                    b.ToTable("Rides");
                });

            modelBuilder.Entity("RideBookingService.Models.RideOffer", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<DateTime>("CreatedAt")
                        .HasColumnType("timestamp with time zone");

                    b.Property<int>("DriverId")
                        .HasColumnType("integer");

                    b.Property<decimal>("FareAmount")
                        .HasColumnType("numeric");

                    b.Property<int>("RideId")
                        .HasColumnType("integer");

                    b.Property<string>("Status")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("DriverId");

                    b.HasIndex("RideId");

                    b.ToTable("RideOffers");
                });

            modelBuilder.Entity("RideBookingService.Models.User", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("integer");

                    NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b.Property<int>("Id"));

                    b.Property<string>("FullName")
                        .HasColumnType("text");

                    b.Property<string>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PhoneNumber")
                        .HasColumnType("text");

                    b.Property<string>("Role")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("Username")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("VehicleInfo")
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("Username")
                        .IsUnique();

                    b.ToTable("Users");
                });

            modelBuilder.Entity("RideBookingService.Models.Rating", b =>
                {
                    b.HasOne("RideBookingService.Models.Ride", "Ride")
                        .WithMany()
                        .HasForeignKey("RideId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Ride");
                });

            modelBuilder.Entity("RideBookingService.Models.Ride", b =>
                {
                    b.HasOne("RideBookingService.Models.User", "Driver")
                        .WithMany()
                        .HasForeignKey("DriverId")
                        .OnDelete(DeleteBehavior.Restrict);

                    b.HasOne("RideBookingService.Models.User", "Rider")
                        .WithMany()
                        .HasForeignKey("RiderId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.Navigation("Driver");

                    b.Navigation("Rider");
                });

            modelBuilder.Entity("RideBookingService.Models.RideOffer", b =>
                {
                    b.HasOne("RideBookingService.Models.User", "Driver")
                        .WithMany()
                        .HasForeignKey("DriverId")
                        .OnDelete(DeleteBehavior.Restrict)
                        .IsRequired();

                    b.HasOne("RideBookingService.Models.Ride", "Ride")
                        .WithMany("Offers")
                        .HasForeignKey("RideId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Driver");

                    b.Navigation("Ride");
                });

            modelBuilder.Entity("RideBookingService.Models.Ride", b =>
                {
                    b.Navigation("Offers");
                });
#pragma warning restore 612, 618
        }
    }
}
