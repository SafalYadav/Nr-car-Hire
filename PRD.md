# NR Car Hire — Product Requirements Document

## 1. Project Overview

NR Car Hire is a premium Australian car-hire platform designed to provide customers with a fast, trustworthy and visually impressive way to discover vehicles, check availability, book cars and pay online.

This is a full-fledged product, not a brochure website.

## 2. Why We Are Building It

The platform should:

- Present NR Car Hire as a premium, trustworthy Australian car-hire business.
- Make vehicle discovery simple.
- Provide real-time/authoritative availability.
- Make booking and checkout straightforward.
- Provide secure online payments.
- Give staff a powerful admin panel.
- Support inventory, bookings, customers, payments and operational management.
- Be production-ready, secure, scalable and maintainable.

## 3. Target Users

### Customers

People in Australia looking to hire a vehicle.

### Administrators / Staff

NR Car Hire staff who manage vehicles, inventory, bookings, customers, pricing, payments and operations.

## 4. Core Customer Experience

Homepage → Fleet → Vehicle Details → Availability → Booking → Checkout → Payment → Confirmation → Customer Account.

## 5. Core Features

### Marketing

- Premium homepage
- Fleet showcase
- About
- Locations
- Contact
- FAQ
- Legal/policy pages

### Fleet

- Vehicle catalogue
- Categories
- Vehicle details
- Specifications
- Images
- Pricing
- Availability
- Locations
- Maintenance status

### Booking

- Pickup/drop-off
- Date/time selection
- Availability validation
- Vehicle selection
- Extras
- Pricing calculation
- Booking creation
- Confirmation
- Cancellation rules
- Double-booking prevention

### Payments

- Australian-compatible payment provider
- AUD checkout
- Secure payment processing
- Webhook verification
- Idempotency
- Failed payments
- Refund handling

### Customer

- Registration/login
- Profile
- Booking history
- Upcoming bookings
- Account settings

### Admin

- Dashboard
- Booking management
- Vehicle CRUD
- Inventory
- Customers
- Payments
- Pricing
- Locations
- Extras
- Reports
- Settings
- Audit logs

## 6. Non-Functional Requirements

- Strong server-side security
- Server-side validation
- Secure authentication and authorization
- Protection against double bookings
- Secure payment verification
- Production monitoring
- Responsive design
- Accessibility
- Good performance
- Maintainable architecture
- AWS-oriented production infrastructure

## 7. Success Criteria

A customer should be able to discover a vehicle, verify availability, complete a booking and payment, and receive confirmation without confusion.

Staff should be able to operate the business from the admin panel.

The final website should look premium enough that it does not feel like an AI-generated template.

## 8. Delivery

Development is planned across seven days. Day 7 is reserved primarily for testing, security review, performance review and final audit.
