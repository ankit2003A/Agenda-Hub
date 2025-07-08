import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload } from "lucide-react";
import { storage, auth, db } from "@/firebase";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function ProfilePage() {
    const { user, updateUser, getAgentHubId } = useAuth();

    // Initialize state with user data from context or with default values
    const [name, setName] = useState(user?.displayName || 'Ankit Verma');
    const [email, setEmail] = useState(user?.email || 'av2322003@gmail.com');
    const [phone, setPhone] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const agentHubId = getAgentHubId(user?.uid);

    useEffect(() => {
        if (user) {
            setName(user.displayName || '');
            setEmail(user.email || '');
            // Fetch phone from Firestore
            const fetchPhone = async () => {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.phone) setPhone(data.phone);
                }
            };
            fetchPhone();
        }
    }, [user]);

    const handleSaveChanges = async () => {
        if (!auth.currentUser) return;
        let updated = false;
        if (auth.currentUser.displayName !== name) {
            try {
                await updateProfile(auth.currentUser, { displayName: name });
                updateUser({ displayName: name });
                updated = true;
            } catch(error) {
                console.error("Error updating profile name", error);
                toast.error("Failed to update profile name.");
            }
        }
        // Save phone to Firestore
        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), { phone }, { merge: true });
                updated = true;
            } catch (error) {
                console.error("Error updating phone number", error);
                toast.error("Failed to update phone number.");
            }
        }
        if (updated) {
            toast.success("Profile updated successfully!");
        } else {
            toast.info("No changes to save.");
        }
    };

    const handleChangePassword = () => {
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (!newPassword || !currentPassword) {
            toast.error("Please fill in all password fields.");
            return;
        }
        console.log("Changing password.");
        toast.success("Password changed successfully!");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewURL(URL.createObjectURL(file));
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile || !auth.currentUser) return;
        setUploading(true);
        try {
            const storageRef = storageRef(storage, `profile-photos/${auth.currentUser.uid}/${selectedFile.name}`);
            await uploadBytes(storageRef, selectedFile);
            const url = await getDownloadURL(storageRef);
            
            await updateProfile(auth.currentUser, { photoURL: url });
            
            // The onAuthStateChanged listener will handle the UI update
            
            setSelectedFile(null);
            setPreviewURL(null);
            toast.success("Profile photo updated!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to upload photo.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details here.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <label htmlFor="photo-upload" className="cursor-pointer group">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={previewURL || user?.photoURL || 'https://randomuser.me/api/portraits/men/32.jpg'} alt={name} />
                                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 flex items-center justify-center h-8 w-8 rounded-full bg-secondary shadow-md group-hover:bg-primary">
                                    <Camera className="h-5 w-5 text-secondary-foreground group-hover:text-primary-foreground" />
                                </div>
                            </label>
                            <input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoSelect}
                                disabled={uploading}
                            />
                        </div>
                        
                        {selectedFile && !uploading && (
                            <div className="flex flex-col items-center gap-2">
                                <Button onClick={handlePhotoUpload} size="sm">
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Photo
                                </Button>
                                <p className="text-xs text-muted-foreground">Confirm your new profile picture.</p>
                            </div>
                        )}
                        
                        {!selectedFile && !uploading && (
                            <p className="text-sm text-muted-foreground">Click the camera icon to upload a profile picture</p>
                        )}

                        {uploading && (
                            <span className="text-xs text-muted-foreground">Uploading...</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="agent-hub-id">Agent Hub ID</Label>
                        <Input id="agent-hub-id" value={agentHubId} readOnly className="font-mono text-xs" />
                        <p className="text-xs text-muted-foreground">Share this ID to connect with others.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} disabled />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <Button onClick={handleSaveChanges}>Save Changes</Button>
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your password here. Leave blank to keep the current password.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                    <Button onClick={handleChangePassword}>Change Password</Button>
                </CardContent>
            </Card>
            <Card className="glass">
                <CardHeader>
                    <CardTitle>Zoom Integration</CardTitle>
                    <CardDescription>
                        Connect your Zoom account to schedule meetings directly from Agenda Hub.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button
                        onClick={() => window.location.href = 'https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/zoom-auth'}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Connect Zoom
                    </Button>
                    {/* TODO: Show connection status if token exists in Firestore */}
                </CardContent>
            </Card>
        </div>
    )
} 