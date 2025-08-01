import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const EditProfileScreen = ({ navigation }) => {
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
            Alert.alert('Error', 'Failed to load profile data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleAvatarChange = () => {
        Alert.alert(
            'Change Avatar',
            'Avatar functionality will be available soon!',
            [{ text: 'OK' }]
        );
    };

    const validateProfile = () => {
        if (!profile.username.trim()) {
            Alert.alert('Error', 'Username is required');
            return false;
        }
        if (!profile.firstName.trim()) {
            Alert.alert('Error', 'First name is required');
            return false;
        }
        if (!profile.lastName.trim()) {
            Alert.alert('Error', 'Last name is required');
            return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validateProfile()) return;

        setIsSaving(true);
        try {
            if (!userId) {
                Alert.alert('Error', 'User not authenticated');
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

            Alert.alert(
                'Success',
                'Profile updated successfully!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <LinearGradient colors={['#1a1a1a', '#2a2a2a', '#1a1a1a']} style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FFD700" />
                    <Text style={styles.loadingText}>Loading profile...</Text>
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
                <Text style={styles.headerTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleSave} disabled={isSaving}>
                    <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
                        {isSaving ? 'Saving...' : 'Save'}
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
                    <Text style={styles.avatarText}>Tap to change photo</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Username *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            placeholder="Enter username"
                            placeholderTextColor="#666"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={[styles.textInput, styles.disabledInput]}
                            value={profile.email}
                            editable={false}
                            placeholder="Email (cannot be changed)"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>First Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={profile.firstName}
                                onChangeText={(value) => handleInputChange('firstName', value)}
                                placeholder="First name"
                                placeholderTextColor="#666"
                            />
                        </View>
                        <View style={[styles.inputGroup, styles.halfWidth]}>
                            <Text style={styles.inputLabel}>Last Name *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={profile.lastName}
                                onChangeText={(value) => handleInputChange('lastName', value)}
                                placeholder="Last name"
                                placeholderTextColor="#666"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.phoneNumber}
                            onChangeText={(value) => handleInputChange('phoneNumber', value)}
                            placeholder="Enter phone number"
                            placeholderTextColor="#666"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Date of Birth</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.dateOfBirth}
                            onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                            placeholder="DD/MM/YYYY"
                            placeholderTextColor="#666"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Location</Text>
                        <TextInput
                            style={styles.textInput}
                            value={profile.location}
                            onChangeText={(value) => handleInputChange('location', value)}
                            placeholder="Enter your location"
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
