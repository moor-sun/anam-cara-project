# Anam Cara Counselling and Wellness Center

Simple starter project:
- Angular UI
- Java Spring Boot API
- AWS DynamoDB appointment storage
- Local mode support using in-memory H2-style simple fallback is not included; DynamoDB local or AWS table recommended.

## 1. Prerequisites
Install:
- VS Code
- Java 17+
- Maven 3.9+
- Node.js 20+
- AWS CLI configured: `aws configure`

Angular CLI is installed locally by `npm install`; a global installation is not required.

## 2. AWS DynamoDB table
Configure the AWS CLI with an IAM user. Never use or commit root credentials:

```cmd
aws configure
aws sts get-caller-identity
```

The application uses Asia Pacific (Mumbai), `ap-south-1`. Setup users need `dynamodb:CreateTable`;
the running backend needs `dynamodb:DescribeTable`, `dynamodb:PutItem`, and `dynamodb:Scan` for:

```text
arn:aws:dynamodb:ap-south-1:YOUR_AWS_ACCOUNT_ID:table/anam_cara_appointments
```

Create and wait for the table:

```cmd
aws dynamodb create-table --table-name anam_cara_appointments --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --billing-mode PAY_PER_REQUEST --region ap-south-1
aws dynamodb wait table-exists --table-name anam_cara_appointments --region ap-south-1
```

## 3. Run backend
Set required admin credentials in the same terminal before starting Spring Boot:

```cmd
set "ADMIN_USERNAME=admin"
set "ADMIN_PASSWORD=replace-with-a-strong-password"
```

Then run:

```cmd
cd backend
mvn spring-boot:run
```
API runs at: `http://localhost:8080`

## 4. Run frontend
```cmd
cd frontend
npm install
npm start
```
UI runs at: `http://localhost:4200`

## 5. Appointment admin

Open `http://localhost:4200/admin` and sign in using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
Appointment creation is public, but listing appointments requires the admin credentials. Use HTTPS when deploying because the admin API uses HTTP Basic authentication.

## 6. WhatsApp notifications

The backend supports the official Meta WhatsApp Cloud API. WhatsApp is disabled until it is configured.

1. In Meta WhatsApp Manager, create and get approval for a Utility template named `anam_cara_new_appointment`, language `en`, with this body:

   `New appointment from {{1}} for {{2}} on {{3}} at {{4}}. Contact: {{5}}.`

2. Set these variables in the same Command Prompt used to run the backend:

```cmd
set "WHATSAPP_ENABLED=true"
set "WHATSAPP_PHONE_NUMBER_ID=your-meta-phone-number-id"
set "WHATSAPP_ACCESS_TOKEN=your-meta-access-token"
set "WHATSAPP_ADMIN_PHONE=917092787291"
set "WHATSAPP_TEMPLATE_NAME=anam_cara_new_appointment"
set "WHATSAPP_TEMPLATE_LANGUAGE=en"
set "WHATSAPP_CONFIRMATION_TEMPLATE_NAME=anam_cara_appointment_confirmed"
```

Create and approve a second Utility template named `anam_cara_appointment_confirmed`, language `en`, with this body:

`Hello {{1}}, your Anam Cara appointment for {{2}} is confirmed for {{3}} at {{4}}. Mode: {{5}}.`

The backend sends this template to the customer's phone only after an administrator selects **Confirm**.

`WHATSAPP_ADMIN_PHONE` must contain the country code and digits only, without `+`. Never commit the access token. Restart the backend after changing these variables.

If a Meta Business/Developer setup is not available yet, leave WhatsApp disabled:

```cmd
set "WHATSAPP_ENABLED=false"
```

## 7. Temporary SMS notifications with AWS

AWS SNS can send a normal SMS to a verified number while WhatsApp is unavailable. SMS charges and country-specific sender-registration requirements may apply. This is currently a manual test facility; automatic appointment-to-SMS publishing still needs to be connected in the backend.

### IAM permissions

Attach this setup policy to the IAM user to verify an SMS sandbox destination:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sms-voice:CreateVerifiedDestinationNumber",
        "sms-voice:SendDestinationNumberVerificationCode",
        "sms-voice:SendTextMessage",
        "sms-voice:VerifyDestinationNumber",
        "sms-voice:DescribeVerifiedDestinationNumbers"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach a separate policy for direct SNS publishing:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "*"
    }
  ]
}
```

Creating a managed policy is not sufficient by itself. Confirm that both policies are attached under IAM > Users > user name > Permissions.

### Verify the destination number

Use E.164 format (`+` followed by country code and number), keeping all commands in `ap-south-1`:

```cmd
aws pinpoint-sms-voice-v2 create-verified-destination-number --destination-phone-number "+91YOUR_NUMBER" --region ap-south-1
```

Copy the returned `VerifiedDestinationNumberId`, then request and verify the OTP:

```cmd
aws pinpoint-sms-voice-v2 send-destination-number-verification-code --verified-destination-number-id "YOUR_VDN_ID" --verification-channel TEXT --language-code EN_US --region ap-south-1
aws pinpoint-sms-voice-v2 verify-destination-number --verified-destination-number-id "YOUR_VDN_ID" --verification-code "YOUR_OTP" --region ap-south-1
```

`VERIFICATION_ALREADY_COMPLETE` means the number is already verified.

### Test an SMS

```cmd
aws sns publish --phone-number "+91YOUR_NUMBER" --message "Anam Cara appointment notification test" --region ap-south-1
```

A successful request returns a `MessageId`, meaning AWS accepted the publish request. Never commit phone numbers, OTPs, access keys, or tokens.

## 8. Check stored appointments

```cmd
aws dynamodb scan --table-name anam_cara_appointments --region ap-south-1 --no-cli-pager
```

Appointments can also be viewed through the Angular admin page at `http://localhost:4200/admin`.

## 9. Email notifications

New appointment alerts can be sent to `anamcarawellnesscentre@gmail.com`. Enable 2-Step Verification
for that Google account, create a Google App Password, and set these variables before starting the backend:

```cmd
set "EMAIL_ENABLED=true"
set "GMAIL_USERNAME=anamcarawellnesscentre@gmail.com"
set "GMAIL_APP_PASSWORD=your-16-character-google-app-password"
set "APPOINTMENT_EMAIL=anamcarawellnesscentre@gmail.com"
```

The Gmail account password must not be used here. Never commit the App Password. Email notifications
are disabled until `EMAIL_ENABLED=true`; a delivery failure does not prevent an appointment from being saved.

## 10. Public AWS deployment

Deploy the backend first so its public URL can be placed in the frontend build.

### Backend: Elastic Beanstalk

```cmd
cd backend
mvn clean package
```

In Elastic Beanstalk, create a Web server environment using the current Corretto Java SE platform
and upload `backend\target\anam-cara-backend-0.0.1-SNAPSHOT.jar`. Configure these environment properties:

```text
PORT=5000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-strong-password
EMAIL_ENABLED=true
GMAIL_USERNAME=anamcarawellnesscentre@gmail.com
GMAIL_APP_PASSWORD=your-google-app-password
APPOINTMENT_EMAIL=anamcarawellnesscentre@gmail.com
CORS_ALLOWED_ORIGINS=https://YOUR-AMPLIFY-DOMAIN.amplifyapp.com
WHATSAPP_ENABLED=false
```

Never commit the real passwords. Attach DynamoDB access for `anam_cara_appointments` to the
Elastic Beanstalk EC2 instance role. Copy the backend origin when the environment is healthy.
Because Amplify is HTTPS, the backend must also be exposed through HTTPS. Elastic Beanstalk HTTPS
normally requires a custom domain and ACM certificate; alternatively put a CloudFront distribution
in front of the Elastic Beanstalk origin and use its HTTPS `cloudfront.net` domain as the frontend API URL.

### Frontend: Amplify Hosting

Set the backend origin in `frontend\src\assets\config.js` without a trailing slash:

```js
window.__ANAM_CARA_API_URL__ = 'https://YOUR-HTTPS-BACKEND-DOMAIN';
```

Build the frontend:

```cmd
cd frontend
npm run build
```

In Amplify Hosting, choose **Deploy without Git** and upload the contents of
`frontend\dist\frontend\browser`. Add a `200 (Rewrite)` rule from `/<*>` to `/index.html` so Angular
routes work when refreshed. Once Amplify gives the final HTTPS domain, set `CORS_ALLOWED_ORIGINS`
in Elastic Beanstalk to that exact origin and restart the environment.

## Main pages
- Home
- About Us
- Services Offered
- Appointment
- Contact
- Admin
