# Terms of Service Implementation Guide

## Overview
This document outlines the implementation of the Terms of Service screen and its integration with the user registration flow in the RAW MINER app.

## 🎯 Implementation Details

### 1. Terms of Service Screen (`src/Screens/TermsOfServiceScreen.js`)

#### Features:
- **Comprehensive Legal Content**: Full legal terms covering all aspects of the mine coin app
- **Educational Disclaimer**: Clear statements that the app is for simulation purposes only
- **Future Cryptocurrency Notice**: Information about potential future real token listings
- **Interactive Acceptance**: Checkbox-style acceptance with Accept/Decline buttons
- **Registration Flow Integration**: Special handling when shown during registration

#### Key Sections:
1. **Acceptance of Terms** - Basic agreement to terms
2. **Description of Service** - App purpose and simulation nature
3. **Virtual Currency and Assets** - No real value disclaimer
4. **Future Cryptocurrency Listing** - Future token possibilities
5. **User Accounts and Registration** - Account responsibilities
6. **Acceptable Use Policy** - Prohibited activities
7. **Educational and Simulation Disclaimer** - Critical legal disclaimers
8. **Privacy and Data Protection** - Privacy policy reference
9. **Intellectual Property Rights** - App ownership
10. **Limitation of Liability** - Legal protections
11. **Indemnification** - User responsibilities
12. **Account Termination** - Termination conditions
13. **Changes to Terms** - Modification rights
14. **Governing Law and Jurisdiction** - Legal framework
15. **Contact Information** - Support details
16. **Acknowledgment and Consent** - Final agreement

### 2. Registration Flow Integration

#### Before (Original Flow):
```
Registration Form → Firebase Auth → User Document Creation → Email Verification → Home
```

#### After (New Flow):
```
Registration Form → Firebase Auth → Terms of Service → User Document Creation → Home
```

#### Key Changes:
- User data is collected but not saved to Firestore initially
- After registration, user is redirected to Terms of Service screen
- User must accept terms to continue
- Upon acceptance, user data is saved with `isTermsAccepted: true`
- User is then navigated to the main Home screen

### 3. User Document Structure Updates

#### New Fields Added:
```javascript
{
    // Terms of Service acceptance
    isTermsAccepted: true,
    termsAcceptedAt: serverTimestamp(),
    
    // Compliance tracking (existing, enhanced)
    compliance: {
        termsAccepted: true,
        termsAcceptedDate: "2024-01-15T10:30:00.000Z",
        // ... other compliance fields
    }
}
```

#### Field Descriptions:
- **`isTermsAccepted`**: Boolean indicating user has accepted terms
- **`termsAcceptedAt`**: Timestamp when terms were accepted
- **`compliance.termsAccepted`**: Legacy compliance tracking field
- **`compliance.termsAcceptedDate`**: Legacy compliance timestamp

## 🔐 Legal Compliance Features

### 1. Educational and Simulation Disclaimers
- Clear statements that no real cryptocurrency mining occurs
- Virtual assets have no real-world value
- App is for educational purposes only
- No financial advice or investment opportunities

### 2. Future Cryptocurrency Provisions
- Current app operates as simulation platform
- Future real token offerings will have separate terms
- Regulatory compliance requirements mentioned
- Additional verification processes outlined

### 3. User Protection Measures
- Comprehensive liability limitations
- Clear user responsibilities
- Account termination conditions
- Data protection and privacy references

## 🎨 User Experience Features

### 1. Visual Design
- **Important Notice Banner**: Orange warning about simulation nature
- **Section Organization**: Clear numbered sections with gold titles
- **Legal Notice Box**: Highlighted final legal disclaimer
- **Acceptance Section**: Interactive checkbox and action buttons

### 2. Interactive Elements
- **Checkbox Toggle**: Visual acceptance indicator
- **Accept/Decline Buttons**: Clear action choices
- **Loading States**: Activity indicator during data saving
- **Error Handling**: User-friendly error messages

### 3. Navigation Flow
- **Back Button**: Returns to previous screen
- **Accept Flow**: Saves data and navigates to Home
- **Decline Flow**: Shows confirmation dialog
- **Registration Return**: Option to return to registration

## 📱 Technical Implementation

### 1. State Management
```javascript
const [hasAccepted, setHasAccepted] = useState(false);
const [isSaving, setIsSaving] = useState(false);
```

### 2. Route Parameters
```javascript
const isRegistrationFlow = route?.params?.isRegistrationFlow || false;
const userData = route?.params?.userData;
const email = route?.params?.email;
```

### 3. Data Saving Process
```javascript
const updatedUserData = {
    ...userData,
    isTermsAccepted: true,
    termsAcceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
};

const userRef = doc(db, "users", userData.uid);
await setDoc(userRef, updatedUserData);
```

### 4. Navigation Logic
```javascript
if (isRegistrationFlow && userData) {
    // Save data and navigate to Home
    navigation.navigate("Home");
} else {
    // Return to previous screen
    navigation.goBack();
}
```

## 🚀 Benefits of This Implementation

### 1. Legal Protection
- Comprehensive terms covering all app aspects
- Clear disclaimers about simulation nature
- Future cryptocurrency provisions
- User acknowledgment and consent

### 2. User Experience
- Clear understanding of app purpose
- Informed consent before use
- Professional legal presentation
- Smooth registration flow

### 3. Compliance
- GDPR and privacy law considerations
- Terms acceptance tracking
- Audit trail for legal purposes
- Future regulatory compliance

### 4. Business Protection
- Liability limitations
- User responsibility definitions
- Intellectual property protection
- Termination and enforcement rights

## 🔧 Maintenance and Updates

### 1. Terms Updates
- Modify content in `TermsOfServiceScreen.js`
- Update "Last Updated" date
- Consider user notification for material changes
- Maintain version history

### 2. Legal Review
- Regular legal review of terms
- Update based on regulatory changes
- Modify based on app feature changes
- Ensure compliance with local laws

### 3. User Communication
- Notify users of terms changes
- Provide clear update summaries
- Maintain user consent records
- Handle user questions and concerns

## 📋 Testing Checklist

### 1. Registration Flow
- [ ] User completes registration form
- [ ] User is redirected to Terms of Service
- [ ] Terms screen displays correctly
- [ ] User can accept/decline terms
- [ ] Data is saved upon acceptance
- [ ] User navigates to Home screen

### 2. Terms Display
- [ ] All sections are visible
- [ ] Text is readable and formatted
- [ ] Important notices are highlighted
- [ ] Legal disclaimers are clear
- [ ] Contact information is accurate

### 3. User Data
- [ ] `isTermsAccepted` field is set to `true`
- [ ] `termsAcceptedAt` timestamp is recorded
- [ ] User document is created in Firestore
- [ ] All user data is preserved
- [ ] No duplicate user creation

### 4. Error Handling
- [ ] Network errors are handled gracefully
- [ ] User sees clear error messages
- [ ] App doesn't crash on errors
- [ ] User can retry failed operations
- [ ] Data integrity is maintained

## 🎯 Future Enhancements

### 1. Version Tracking
- Track terms version numbers
- Store user acceptance by version
- Handle terms updates gracefully
- Maintain acceptance history

### 2. Multi-language Support
- Translate terms to other languages
- Handle RTL languages
- Maintain legal accuracy across translations
- Localize legal requirements

### 3. Advanced Compliance
- Age verification integration
- Geographic restrictions
- Regulatory compliance tracking
- Automated compliance reporting

---

**Note**: This implementation provides a robust, legally compliant Terms of Service system that protects both users and the business while maintaining a smooth user experience. Regular legal review and updates are recommended to ensure continued compliance and protection.
