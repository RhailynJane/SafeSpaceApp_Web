'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
    Megaphone, 
    Plus, 
    Pencil, 
    Trash2, 
    Eye, 
    EyeOff, 
    Image as ImageIcon,
    X,
    Calendar,
    User,
    RefreshCw
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit' | 'delete'
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        active: true,
        images: []
    });
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/admin/announcements');
            if (response.ok) {
                const data = await response.json();
                console.log('Announcements data:', data);
                setAnnouncements(data.announcements || []);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
            }
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setDialogMode('create');
        setFormData({ title: '', body: '', active: true, images: [] });
        setImageFiles([]);
        setImagePreviews([]);
        setSelectedAnnouncement(null);
        setShowDialog(true);
    };

    const handleEdit = (announcement) => {
        setDialogMode('edit');
        setSelectedAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            body: announcement.body,
            active: announcement.active,
            images: announcement.images || []
        });
        setImageFiles([]);
        setImagePreviews(announcement.images || []);
        setShowDialog(true);
    };

    const handleDelete = (announcement) => {
        setDialogMode('delete');
        setSelectedAnnouncement(announcement);
        setShowDialog(true);
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const totalImages = imagePreviews.length + files.length;
        
        if (totalImages > 3) {
            alert('Maximum 3 images allowed');
            return;
        }

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setImageFiles(prev => [...prev, ...files]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    const handleRemoveImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => {
            const updated = prev.filter((_, i) => i !== index);
            // Revoke object URL if it's a local preview
            if (prev[index].startsWith('blob:')) {
                URL.revokeObjectURL(prev[index]);
            }
            return updated;
        });
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.body.trim()) {
            alert('Title and body are required');
            return;
        }

        setSubmitting(true);
        try {
            const endpoint = dialogMode === 'create' 
                ? '/api/admin/announcements'
                : `/api/admin/announcements/${selectedAnnouncement.id}`;
            
            const method = dialogMode === 'create' ? 'POST' : 'PUT';

            // Prepare form data for multipart upload
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('body', formData.body);
            formDataToSend.append('active', formData.active);

            // Add new image files
            imageFiles.forEach((file) => {
                formDataToSend.append('images', file);
            });

            // Add existing image URLs (for edit mode)
            if (dialogMode === 'edit') {
                const existingImages = imagePreviews.filter(url => !url.startsWith('blob:'));
                formDataToSend.append('existingImages', JSON.stringify(existingImages));
            }

            const response = await fetch(endpoint, {
                method,
                body: formDataToSend
            });

            if (response.ok) {
                await fetchAnnouncements();
                setShowDialog(false);
                setFormData({ title: '', body: '', active: true, images: [] });
                setImageFiles([]);
                setImagePreviews([]);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to save announcement');
            }
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('Failed to save announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        setSubmitting(true);
        try {
            const response = await fetch(`/api/admin/announcements/${selectedAnnouncement.id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchAnnouncements();
                setShowDialog(false);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete announcement');
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
            alert('Failed to delete announcement');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleActive = async (announcement) => {
        try {
            const response = await fetch(`/api/admin/announcements/${announcement.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title: announcement.title,
                    body: announcement.body,
                    active: !announcement.active 
                })
            });

            if (response.ok) {
                await fetchAnnouncements();
            }
        } catch (error) {
            console.error('Error toggling announcement:', error);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl">
                        <Megaphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Announcements</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Manage organization-wide announcements for mobile app
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={fetchAnnouncements}
                        disabled={loading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        New Announcement
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-teal-200 dark:border-teal-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                                    {announcements.length}
                                </p>
                            </div>
                            <Megaphone className="h-8 w-8 text-teal-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                    {announcements.filter(a => a.active).length}
                                </p>
                            </div>
                            <Eye className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Inactive</p>
                                <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">
                                    {announcements.filter(a => !a.active).length}
                                </p>
                            </div>
                            <EyeOff className="h-8 w-8 text-gray-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Announcements List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3 animate-spin" />
                        <p className="text-gray-500 dark:text-gray-400">Loading announcements...</p>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-12">
                        <Megaphone className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
                        <Button 
                            onClick={handleCreate}
                            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create First Announcement
                        </Button>
                    </div>
                ) : (
                    announcements.map((announcement) => (
                        <Card 
                            key={announcement.id} 
                            className={`border-2 transition-all ${
                                announcement.active 
                                    ? 'border-teal-200 dark:border-teal-800 bg-white dark:bg-gray-800' 
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                            }`}
                        >
                            <CardContent className="p-6">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                                        {announcement.title}
                                                    </h3>
                                                    <Badge className={
                                                        announcement.active 
                                                            ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700' 
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                                                    }>
                                                        {announcement.active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                                    {announcement.body}
                                                </p>
                                                {announcement.images && announcement.images.length > 0 && (
                                                    <div className="flex gap-2 mt-3">
                                                        {announcement.images.map((img, idx) => (
                                                            <img 
                                                                key={idx}
                                                                src={img}
                                                                alt={`Attachment ${idx + 1}`}
                                                                className="h-20 w-20 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="flex gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(announcement.created_at).toLocaleDateString()}
                                                    </span>
                                                    {announcement.authorId && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-3 w-3" />
                                                            Admin
                                                        </span>
                                                    )}
                                                    {announcement.readBy && (
                                                        <span>{announcement.readBy.length} reads</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => toggleActive(announcement)}
                                            className="gap-2"
                                        >
                                            {announcement.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            {announcement.active ? 'Hide' : 'Show'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEdit(announcement)}
                                            className="gap-2"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(announcement)}
                                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog && dialogMode !== 'delete'} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl dark:bg-gray-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">
                            {dialogMode === 'create' ? 'Create New Announcement' : 'Edit Announcement'}
                        </DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            {dialogMode === 'create' 
                                ? 'Create an announcement that will be visible to all users in your organization on the mobile app.'
                                : 'Update the announcement details. Changes will be reflected immediately.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                placeholder="Enter announcement title"
                                className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                            <Textarea
                                value={formData.body}
                                onChange={(e) => setFormData({...formData, body: e.target.value})}
                                placeholder="Enter announcement message"
                                rows={6}
                                className="mt-1 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Images (max 3, will be compressed)
                            </label>
                            <div className="mt-2 space-y-3">
                                {imagePreviews.length < 3 && (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
                                        >
                                            <ImageIcon className="h-5 w-5 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                Click to add images ({imagePreviews.length}/3)
                                            </span>
                                        </label>
                                    </div>
                                )}
                                {imagePreviews.length > 0 && (
                                    <div className="flex gap-3 flex-wrap">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={preview}
                                                    alt={`Preview ${index + 1}`}
                                                    className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                                                />
                                                <button
                                                    onClick={() => handleRemoveImage(index)}
                                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.active}
                                onChange={(e) => setFormData({...formData, active: e.target.checked})}
                                id="active-checkbox"
                                className="rounded"
                            />
                            <label htmlFor="active-checkbox" className="text-sm text-gray-700 dark:text-gray-300">
                                Active (visible to users)
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={submitting}
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                dialogMode === 'create' ? 'Create Announcement' : 'Save Changes'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDialog && dialogMode === 'delete'} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-gray-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-gray-100">Delete Announcement</DialogTitle>
                        <DialogDescription className="dark:text-gray-400">
                            Are you sure you want to delete this announcement? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAnnouncement && (
                        <div className="py-4">
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedAnnouncement.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedAnnouncement.body}</p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDeleteConfirm} 
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
