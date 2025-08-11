// Full JavaScript version of KYCScreen component

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';

const KYCScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [currentStep, setCurrentStep] = useState(1);
    const [kycData, setKycData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        address: '',
        city: '',
        country: '',
        postalCode: '',
        phoneNumber: '',
        idNumber: '',
        idType: 'passport',
    });

    const [frontImage, setFrontImage] = useState(null);
    const [backImage, setBackImage] = useState(null);
    const [selfieImage, setSelfieImage] = useState(null);

    const steps = [
        { id: 1, title: t('kyc.personalInfo'), icon: 'person' },
        { id: 2, title: t('kyc.address'), icon: 'location' },
        { id: 3, title: t('kyc.documents'), icon: 'document' },
        { id: 4, title: t('kyc.verification'), icon: 'checkmark-circle' },
    ];

    const handleInputChange = (field, value) => {
        setKycData(prev => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = (type) => {
        Alert.alert(
            t('kyc.uploadDocument'),
            t('kyc.chooseUploadMethod'),
            [
                { text: t('kyc.camera'), onPress: () => console.log('Camera pressed') },
                { text: t('kyc.gallery'), onPress: () => console.log('Gallery pressed') },
                { text: t('kyc.cancel'), style: 'cancel' },
            ]
        );
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const submitKYC = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            Alert.alert(t('kyc.kycSubmitted'), t('kyc.verificationRequestSubmitted'), [
                { text: t('kyc.ok'), onPress: () => navigation.replace('Main') },
            ]);
        } catch (error) {
            Alert.alert(t('kyc.error'), t('kyc.failedToSubmitKyc'));
        }
    };

    const renderStepIndicator = () => (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
            {steps.map((step, index) => (
                <View key={step.id} style={{ alignItems: 'center', flex: 1 }}>
                    <View style={{
                        width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                        backgroundColor: currentStep >= step.id ? '#FFD700' : '#444'
                    }}>
                        <Ionicons name={step.icon} size={16} color={currentStep >= step.id ? '#1a1a1a' : '#888'} />
                    </View>
                    <Text style={{ fontSize: 12, color: currentStep >= step.id ? '#FFD700' : '#888' }}>{step.title}</Text>
                    {index < steps.length - 1 && (
                        <View style={{ position: 'absolute', top: 20, right: -20, width: 40, height: 2, backgroundColor: currentStep > step.id ? '#FFD700' : '#444' }} />
                    )}
                </View>
            ))}
        </View>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return <Text style={{ color: 'white' }}>{t('kyc.step1PersonalInfo')}</Text>;
            case 2:
                return <Text style={{ color: 'white' }}>{t('kyc.step2Address')}</Text>;
            case 3:
                return <Text style={{ color: 'white' }}>{t('kyc.step3Documents')}</Text>;
            case 4:
                return <Text style={{ color: 'white' }}>{t('kyc.step4Verification')}</Text>;
            default:
                return null;
        }
    };

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#fff' }}>{t('kyc.kycTitle')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
                {renderStepIndicator()}
                {renderCurrentStep()}
            </ScrollView>

            <View style={{ flexDirection: 'row', padding: 20, paddingBottom: 40 }}>
                {currentStep > 1 && (
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, alignItems: 'center', marginRight: 10 }} onPress={prevStep}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{t('kyc.previous')}</Text>
                    </TouchableOpacity>
                )}
                {currentStep < 4 ? (
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFD700', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginLeft: 10 }} onPress={nextStep}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginRight: 8 }}>{t('kyc_next')}</Text>
                        <Ionicons name="arrow-forward" size={20} color="#1a1a1a" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity style={{ flex: 1, backgroundColor: '#FFD700', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginLeft: 10 }} onPress={submitKYC}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginRight: 8 }}>{t('kyc_submit_kyc')}</Text>
                        <Ionicons name="checkmark" size={20} color="#1a1a1a" />
                    </TouchableOpacity>
                )}
            </View>
        </LinearGradient>
    );
};

export default KYCScreen;
