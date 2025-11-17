import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function EditProfileModal({ open, onOpenChange, client, onSave }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const updateClient = useMutation(api.clients.update);

  useEffect(() => {
    if (client) {
      setFormData({
        client_first_name: client.client_first_name || '',
        client_last_name: client.client_last_name || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
      });
    }
  }, [client]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const clientId = client?._id || client?.id; // support both shapes
      if (!clientId) throw new Error('Invalid client');

      // Map legacy fields to Convex fields
      const payload = {
        clerkId: user?.id,
        clientId,
        firstName: formData.client_first_name,
        lastName: formData.client_last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
      };

      // If legacy numeric id, this will fail type-wise; Convex expects Id<"clients">. Prefer _id.
      const result = await updateClient(payload);

      if (onSave) onSave({
        _id: client._id || result,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        phone: payload.phone,
        address: payload.address,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update the client's profile information.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="client_first_name">First Name</Label>
            <Input id="client_first_name" value={formData.client_first_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_last_name">Last Name</Label>
            <Input id="client_last_name" value={formData.client_last_name} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={formData.address} onChange={handleChange} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
