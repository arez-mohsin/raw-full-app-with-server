import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import ToastService from '../utils/ToastService';

const EditProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        location: '',
        dateOfBirth: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                await loadProfile(user.uid);
            } else {
                setUserId(null);
                navigation.replace('Login');
            }
        });

        return unsubscribe;
    }, [navigation]);

    const loadProfile = async (uid) => {
        try {
            setIsLoading(true);
            const userDoc = await getDoc(doc(db, 'users', uid));

            if (userDoc.exists()) {
                const userData = userDoc.data();
                setProfile({
                    username: userData.username || '',
                    email: userData.email || '',
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    phoneNumber: userData.phoneNumber || '',
                    location: userData.location || '',
                    dateOfBirth: userData.dateOfBirth || '',
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            ToastService.error(t('errors.somethingWentWrong'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = () => {
        ToastService.info(t('profile.profilePicture'));
    };

    const validateProfile = () => {
        if (!profile.username.trim()) {
            ToastService.error(t('validation.required'));
            return false;
        }
        if (!profile.firstName.trim()) {
            ToastService.error(t('validation.required'));
            return false;
        }
        if (!profile.lastName.trim()) {
            ToastService.error(t('validation.required'));
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateProfile()) return;

        setIsSaving(true);
        try {
            if (!userId) {
                ToastService.error(t('errors.authenticationError'));
                return;
            }

            // Update user document in Firestore
            await updateDoc(doc(db, 'users', userId), {
                username: profile.username.trim(),
                firstName: profile.firstName.trim(),
                lastName: profile.lastName.trim(),
                phoneNumber: profile.phoneNumber.trim(),
                location: profile.location.trim(),
                dateOfBirth: profile.dateOfBirth.trim(),
                updatedAt: new Date(),
            });

            ToastService.success(t('profile.profileUpdated'));
            setTimeout(() => navigation.goBack(), 1500);
        } catch (error) {
            console.error('Error updating profile:', error);
            ToastService.error(t('errors.somethingWentWrong'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.editProfileTitle')}</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                        {isSaving ? t('common.loading') : t('profile.saveProfile')}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Ionicons name="person" size={40} color="#FFD700" />
                        </View>
                        <TouchableOpacity style={styles.editAvatarButton} onPress={handleAvatarChange}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.avatarText}>{t('profile.takePhoto')}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('profile.personalInformation')}</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('profile.username')} *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            placeholder={t('profile.username')}
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('profile.email')}</Text>
                        <TextInput
                            style={[styles.textInput, styles.disabledInput]}
                            value={profile.email}
                            editable={false}
                            placeholder={t('profile.email')}
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>{t('profile.firstName')} *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={profile.firstName}
                                onChangeText={(value) => handleInputChange('firstName', value)}
                                placeholder={t('profile.firstName')}
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>{t('profile.lastName')} *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={profile.lastName}
                                onChangeText={(value) => handleInputChange('lastName', value)}
                                placeholder={t('profile.lastName')}
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('profile.phone')}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.phoneNumber}
                            onChangeText={(value) => handleInputChange('phoneNumber', value)}
                            placeholder={t('profile.phone')}
                            placeholderTextColor="#666"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('profile.dateOfBirth')}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.dateOfBirth}
                            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>{t('profile.location')}</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.location}
                            onChangeText={(value) => handleInputChange('location', value)}
                            placeholder={t('profile.location')}
                            placeholderTextColor="#666"
                        />
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    saveButton: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    saveButtonDisabled: {
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2a2a2a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FFD700',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 14,
        color: '#888',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 8,
        fontWeight: '500',
    },
    textInput: {
        backgroundColor: '#2a2a2a',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#444',
    },
    disabledInput: {
        opacity: 0.6,
        backgroundColor: '#1a1a1a',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfWidth: {
        width: '48%',
    },
});

export default EditProfileScreen;
