# Email Setup Guide for Tixhub

## Issues Fixed

I've identified and fixed several critical issues that were preventing tickets from being sent to users' emails:

### 1. **Missing Environment Variables**
- Created `.env` file with required email configuration
- Added proper email service variables

### 2. **Incorrect Payment Callback URL**
- Fixed callback URL to match your actual route structure
- Updated to include proper ticket and event IDs

### 3. **Ticket Lookup Logic**
- Simplified ticket lookup to use only the ticket ID
- Removed unnecessary email matching that could cause failures

### 4. **Code Issues**
- Fixed duplicate location property in eventDetails
- Added better error handling and logging
- Improved email success/failure tracking

## Required Setup Steps

### 1. Configure Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Copy the 16-character password

### 2. Update Environment Variables

Edit the `.env` file and replace the placeholder values:

```env
# Email Configuration (Gmail)
EMAIL_USER=your_actual_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password

# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Paystack Configuration
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Update Callback URL for Production

In `src/service/paystackservice.js`, update the callback URL for your production environment:

```javascript
callback_url: `https://yourdomain.com/api/tickets/verify-payment/event/${eventId}/ticket/${ticketId}/callback`
```

## Testing the Fix

### 1. Test Email Configuration
```bash
# Start your server
npm start

# Check console logs for email service initialization
```

### 2. Test Payment Flow
1. Create a test event
2. Purchase a ticket
3. Complete payment
4. Check console logs for email sending status
5. Verify email delivery

### 3. Monitor Logs
The updated code now provides detailed logging:
- Email sending success/failure
- Message IDs for tracking
- Specific error details for debugging

## Common Issues & Solutions

### Issue: "Invalid login" error
**Solution**: Use App Password instead of regular Gmail password

### Issue: "Less secure app access" error
**Solution**: Enable 2-Factor Authentication and use App Password

### Issue: Emails going to spam
**Solution**: 
- Add SPF record to your domain
- Use a professional email service (SendGrid, Mailgun) for production

### Issue: Callback URL not working
**Solution**: 
- Ensure your server is running
- Check that the route matches exactly
- Verify the URL is accessible from Paystack

## Production Recommendations

1. **Use Professional Email Service**: Consider SendGrid, Mailgun, or AWS SES for better deliverability
2. **Add Email Templates**: Create professional email templates
3. **Implement Retry Logic**: Add retry mechanism for failed email sends
4. **Add Email Queue**: Use Redis or similar for handling email queues
5. **Monitor Email Delivery**: Track bounce rates and delivery statistics

## Files Modified

- `src/controllers/buyTicketcontroller.js` - Fixed ticket lookup and email handling
- `src/service/paystackservice.js` - Fixed callback URL
- `.env` - Added email configuration template

The email delivery should now work properly after completing the setup steps above.
