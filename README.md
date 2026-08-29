# Anam Cara Counselling and Wellness Center

An Angular and Spring Boot application for Anam Cara's public website, appointment booking, media publishing, testimonials, and administrative tracking.

## Features

### Public website

- Home, About Us, Services, Appointment, Gallery, Testimonials, and Contact pages.
- Online and in-person appointment requests.
- Available 60-minute appointment windows in half-hour increments.
- Razorpay payment order creation and verification.
- Responsive gallery thumbnails with optional caption overlays.
- Full-size image and video viewing when a gallery item is selected.
- Public testimonials with optional name, company/organisation, photo, or video.

### Admin portal

Open `/admin` and sign in with the configured admin username and password. The portal is organised into these tabs:

- **Appointments**: view, confirm, reject, edit, delete, and export appointments as CSV.
- **Add Manual Appointment**: record phone/offline bookings and consultations that already occurred.
- **Gallery & Testimonials**: create, edit, replace media, and delete published content.

Manual appointments:

- Allow past dates for historical consulting records.
- Support an amount-paid value, including `0` for unpaid consultations.
- Are saved as confirmed tracking records.
- Do not send email or WhatsApp notifications.

Appointment editing preserves the original creation time and status. When an appointment's date or time changes, the backend reserves the new 60-minute window and releases the old reservation. Admin editing does not send notifications.

## Technology

- Angular standalone-component frontend
- Java 17 and Spring Boot backend
- Amazon DynamoDB for appointments, slot reservations, and content metadata
- Private Amazon S3 bucket for gallery and testimonial media
- Razorpay for online payment verification
- Optional Gmail and Meta WhatsApp Cloud API notifications
- AWS Elastic Beanstalk backend deployment
- AWS Amplify frontend hosting
- Amazon CloudFront HTTPS/API routing

## Prerequisites

Install:

- Java 17 or later
- Maven 3.9 or later
- Node.js 20 or later
- AWS CLI configured with an IAM identity

Angular CLI is installed locally by `npm install`; a global Angular CLI installation is unnecessary.

## AWS resources

The default AWS region is Asia Pacific (Mumbai), `ap-south-1`.

### DynamoDB

Create the application table:

```cmd
aws dynamodb create-table --table-name anam_cara_appointments --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region ap-south-1
aws dynamodb wait table-exists --table-name anam_cara_appointments --region ap-south-1
```

The backend uses the same table for:

- `APPOINTMENT` records
- Minute-level `SLOT` reservation records
- `SITE_CONTENT` Gallery and Testimonial metadata

The runtime IAM role needs the applicable DynamoDB permissions, including:

```text
dynamodb:BatchWriteItem
dynamodb:DeleteItem
dynamodb:GetItem
dynamodb:PutItem
dynamodb:Scan
dynamodb:TransactWriteItems
dynamodb:UpdateItem
```

Scope these permissions to:

```text
arn:aws:dynamodb:ap-south-1:YOUR_AWS_ACCOUNT_ID:table/anam_cara_appointments
```

### Private S3 media bucket

Create or select a private S3 bucket for uploaded photos and videos. Keep Block Public Access enabled. The Elastic Beanstalk EC2 instance role needs:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AnamCaraMediaAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_MEDIA_BUCKET/*"
    }
  ]
}
```

Media remains private in S3. The backend streams it through `/api/uploads/{key}`, allowing the existing CloudFront `/api/*` routing and application security configuration to be used.

## Local configuration

Create a root `.env` file or define the variables in the terminal that starts the backend. `.env` is ignored by Git.

Minimum configuration:

```properties
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
APP_DYNAMODB_TABLE=anam_cara_appointments
APP_MEDIA_BUCKET=your-private-media-bucket
CORS_ALLOWED_ORIGINS=http://localhost:4200
```

`APP_UPLOAD_DIRECTORY` is retained only for legacy configuration and is not required for current S3-backed media storage.

### Optional email configuration

```properties
EMAIL_ENABLED=true
GMAIL_USERNAME=anamcarawellnesscentre@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
APPOINTMENT_EMAIL=anamcarawellnesscentre@gmail.com
```

Use a Google App Password, not the Gmail account password. A delivery failure does not prevent a public appointment from being saved.

### Optional WhatsApp configuration

```properties
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER_ID=your-meta-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-meta-access-token
WHATSAPP_ADMIN_PHONE=91XXXXXXXXXX
WHATSAPP_TEMPLATE_NAME=anam_cara_new_appointment
WHATSAPP_TEMPLATE_LANGUAGE=en
WHATSAPP_CONFIRMATION_TEMPLATE_NAME=anam_cara_appointment_confirmed
```

The admin notification template is expected to accept name, service, date, time, and contact values. The confirmation template is sent to the customer only when an administrator confirms an eligible public appointment. Keep WhatsApp disabled if Meta templates and credentials are not configured.

Never commit passwords, App Passwords, access tokens, OTPs, or AWS credentials.

## Run locally

### Backend

```cmd
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080` by default.

After backend source changes, stop the existing process with `Ctrl+C` and restart it. A running Spring Boot process does not necessarily load newly added controller endpoints automatically.

Build the deployable JAR with:

```cmd
cd backend
mvn clean package -DskipTests
```

Output:

```text
backend/target/anam-cara-backend-0.0.1-SNAPSHOT.jar
```

### Frontend

```cmd
cd frontend
npm install
npm start
```

The UI runs at `http://localhost:4200`.

Build the production frontend with:

```cmd
cd frontend
npm run build
```

Amplify deployment files are produced in:

```text
frontend/dist/frontend/browser
```

## Administration behavior

### Appointment operations

Admin authentication uses HTTP Basic authentication. Use HTTPS in every deployed environment.

Supported administration includes:

- Listing all appointments
- Confirming or rejecting eligible public appointments
- Creating manual appointments without notifications
- Editing client, service, date/time, payment, and note fields
- Deleting appointments and releasing their reserved slots
- Exporting the currently loaded appointment list to an Excel-compatible CSV file

### Gallery and Testimonials operations

Administrators can:

- Upload images or supported videos
- Add or edit gallery captions
- Add or edit testimonial text, name, and company/organisation
- Replace existing media
- Delete content and its associated S3 object

The public Gallery displays compact items and opens the selected media at its original viewing size.

## Deployment

Deploy the backend before the frontend whenever API endpoints have changed.

### Elastic Beanstalk backend

Build and upload the Spring Boot JAR from `backend/target`. Configure at least:

```text
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
APP_DYNAMODB_TABLE=anam_cara_appointments
APP_MEDIA_BUCKET=your-private-media-bucket
CORS_ALLOWED_ORIGINS=https://www.your-domain.example,https://your-domain.example
EMAIL_ENABLED=false
WHATSAPP_ENABLED=false
```

Attach both DynamoDB and S3 policies to the **EC2 instance profile** used by the Elastic Beanstalk environment, not only to the Elastic Beanstalk service role.

`APP_UPLOAD_DIRECTORY` is unnecessary for the S3 media implementation.

### CloudFront API routing

When CloudFront fronts Elastic Beanstalk:

- Forward `/api/*` to the Elastic Beanstalk origin.
- Allow `GET`, `HEAD`, `OPTIONS`, `PUT`, `POST`, `PATCH`, and `DELETE`.
- Use a disabled-cache policy for API requests.
- Forward viewer headers except `Host`, including `Authorization`, `Origin`, and `Content-Type`.

If a media upload receives CloudFront `403` and no corresponding `POST /api/content` appears in Elastic Beanstalk logs, inspect AWS WAF. Multipart uploads can trigger a managed request-body or size restriction. Prefer a narrowly scoped exception for the identified rule and `POST /api/content`; do not permanently disable protection for the entire distribution.

### Amplify frontend

Set the HTTPS backend origin in `frontend/src/assets/config.js` without a trailing slash:

```js
window.__ANAM_CARA_API_URL__ = 'https://YOUR-CLOUDFRONT-OR-BACKEND-DOMAIN';
```

Build the frontend and upload the contents of `frontend/dist/frontend/browser`, ensuring `index.html` is at the ZIP root.

Configure an Amplify single-page application rewrite that sends extensionless application routes to `/index.html` with status `200`. Do not rewrite JavaScript, CSS, images, or other static assets.

After changing the public domain, add every exact frontend origin—including `www` and non-`www` variants if both are used—to `CORS_ALLOWED_ORIGINS`, and restart or redeploy the backend.

## Useful checks

Backend health:

```cmd
curl http://localhost:8080/api/health
```

Public content metadata:

```cmd
curl http://localhost:8080/api/content
```

Inspect stored application records:

```cmd
aws dynamodb scan --table-name anam_cara_appointments --region ap-south-1 --no-cli-pager
```

## Main routes

- `/` — Home
- `/about` — About Us
- `/services` — Services Offered
- `/appointment` — Appointment booking
- `/gallery` — Gallery
- `/testimonials` — Testimonials
- `/contact` — Contact
- `/admin` — Administration