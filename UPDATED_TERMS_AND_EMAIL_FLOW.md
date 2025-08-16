# Updated Terms of Service and Email Verification Flow

## Overview
This document outlines the updated user flow for Terms of Service acceptance and Email Verification in the RAW MINER app. The new flow prevents users from going back to registration and provides clear guidance on email verification.

## 🚀 Updated User Flow

### **Complete Registration Flow**
```
1. User Registration → 2. Terms of Service → 3. Email Verification → 4. Home Screen
```

### **Step-by-Step Breakdown**

#### **Step 1: User Registration**
- User fills out registration form
- Firebase Auth creates user account
- User document created in Firestore with `isTermsAccepted: false`
- Navigation to Terms of Service screen

#### **Step 2: Terms of Service**
- **No Back Button**: Users cannot return to registration
- **Clear Instructions**: Email verification steps shown
- **Terms Acceptance**: User must accept terms to continue
- **Navigation**: After acceptance, goes to Email Verification

#### **Step 3: Email Verification**
- User receives verification email
- Clicks verification link
- Returns to app to complete setup
- Account activated and navigates to Home

#### **Step 4: Home Screen**
- User can now access all app features
- Mining simulation begins
- Full app functionality unlocked

## 🔒 Security & User Experience Improvements

### **1. No Back Navigation**
- **Registration Flow**: Back button hidden during registration
- **Prevents Confusion**: Users can't accidentally return to registration
- **Clear Path Forward**: Only option is to complete the flow

### **2. Clear Email Verification Instructions**
- **Step-by-Step Guide**: Visual instructions for email verification
- **Email Display**: Shows user's email address clearly
- **Troubleshooting**: Tips for finding verification emails
- **Support Contact**: Direct support access if needed

### **3. Enhanced Terms Acceptance**
- **Educational Content**: Clear explanation of what users are agreeing to
- **Visual Feedback**: Progress indicators and success messages
- **No Pressure**: Users can review terms at their own pace

## 📧 Email Verification Instructions

### **What Users See on Terms Screen**
```
📧 Next Step: Email Verification

After accepting terms, you'll need to verify your email address 
(user@example.com) to activate your account.

Steps to verify:
✓ Check your email for verification link
✓ Click the verification link in the email  
✓ Return to app to complete setup

💡 Can't find the email? Check your spam folder or contact support.
```

### **Verification Process**
1. **Email Sent**: Verification email sent to user's email address
2. **Link Click**: User clicks verification link in email
3. **Email Verified**: Firebase marks email as verified
4. **App Update**: User returns to app, account fully activated
5. **Home Navigation**: User taken to main app screen

## 🎯 User Experience Benefits

### **1. Clear Progress Path**
- **No Confusion**: Users know exactly what to do next
- **Step-by-Step**: Clear instructions for each phase
- **Visual Guidance**: Icons and colors guide users through process

### **2. Reduced Abandonment**
- **No Back Option**: Users must complete the flow
- **Clear Expectations**: Know what's required at each step
- **Support Available**: Help accessible if needed

### **3. Professional Feel**
- **Polished Flow**: Smooth transition between screens
- **Clear Communication**: Users understand the process
- **Trust Building**: Professional onboarding experience

## 🔧 Technical Implementation

### **1. Navigation Control**
```javascript
// Hide back button during registration flow
{!isRegistrationFlow ? (
    <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
    </TouchableOpacity>
) : (
    <View style={{ width: 24 }} />
)}
```

### **2. Terms Acceptance Flow**
```javascript
// After accepting terms, navigate to email verification
navigation.navigate("EmailVerification", {
    email: email,
    uid: uid,
    isRegistrationFlow: true,
});
```

### **3. Decline Terms Handling**
```javascript
// No option to go back to registration
// Only options: Review terms, contact support, or cancel
const handleDeclineTerms = () => {
    Alert.alert(
        "Terms Required",
        "You must accept the Terms of Service to continue. Your account has been created but cannot be activated without accepting these terms.",
        [
            { text: "Review Terms Again", style: "default" },
            { text: "Contact Support", style: "default" },
            { text: "Cancel", style: "cancel" }
        ]
    );
};
```

## 📱 Screen Flow Details

### **Terms of Service Screen**
- **Header**: No back button during registration
- **Welcome Message**: "Almost Done! 🎉"
- **Terms Summary**: Key points highlighted
- **Email Verification Info**: Clear next steps
- **Acceptance Checkbox**: Terms agreement
- **Action Buttons**: "Accept & Continue" (primary), "Cancel" (secondary)

### **Email Verification Screen**
- **Purpose**: Verify user's email address
- **Input**: Email verification code or link handling
- **Success**: Navigate to Home screen
- **Failure**: Show error and retry options

### **Home Screen**
- **Full Access**: All app features unlocked
- **Mining Start**: User can begin mining simulation
- **Account Status**: Fully verified and active

## 🚫 What Users Cannot Do

### **1. Return to Registration**
- **No Back Button**: Back button hidden during registration flow
- **No Navigation**: Cannot navigate back to registration screen
- **Must Complete**: Only option is to finish the flow

### **2. Skip Terms Acceptance**
- **Required Step**: Terms must be accepted to continue
- **No Bypass**: Cannot proceed without agreement
- **Clear Requirement**: User understands this is mandatory

### **3. Skip Email Verification**
- **Account Activation**: Email verification required for full access
- **Security**: Ensures user owns the email address
- **Complete Setup**: Part of account creation process

## 💡 User Guidance Features

### **1. Visual Instructions**
- **Step Icons**: Clear visual representation of each step
- **Color Coding**: Different colors for different types of information
- **Progress Indicators**: Users know where they are in the process

### **2. Helpful Tips**
- **Spam Folder**: Reminder to check spam/junk folders
- **Support Contact**: Direct access to support team
- **Troubleshooting**: Common issues and solutions

### **3. Clear Messaging**
- **Positive Language**: Encouraging and supportive tone
- **Simple Instructions**: Easy to understand steps
- **No Jargon**: User-friendly language throughout

## 🔮 Future Enhancements

### **1. Email Verification Improvements**
- **Resend Option**: Allow users to resend verification emails
- **Alternative Methods**: SMS verification as backup
- **Auto-Detection**: Detect when email is verified automatically

### **2. User Experience Enhancements**
- **Progress Bar**: Visual progress indicator through all steps
- **Skip Options**: Allow skipping certain steps for returning users
- **Personalization**: Customize flow based on user preferences

### **3. Analytics & Monitoring**
- **Flow Tracking**: Monitor where users drop off
- **Success Rates**: Track completion rates for each step
- **User Feedback**: Collect feedback on the onboarding experience

## 📊 Expected Outcomes

### **1. User Metrics**
- **Higher Completion Rate**: 20-30% improvement in full registration
- **Faster Verification**: Clearer instructions reduce verification time
- **Reduced Support**: Fewer questions about the process

### **2. Security Benefits**
- **Verified Emails**: All users have verified email addresses
- **Account Security**: Better account ownership verification
- **Fraud Prevention**: Reduced fake account creation

### **3. Business Benefits**
- **Better User Quality**: Verified users are more engaged
- **Reduced Churn**: Clear process reduces abandonment
- **Professional Image**: Polished onboarding experience

---

**Note**: This updated flow ensures users complete the full registration process while providing clear guidance and preventing confusion. The focus on email verification ensures account security while maintaining a smooth user experience.
