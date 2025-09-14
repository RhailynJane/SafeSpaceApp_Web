"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SafespacePlatform() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-center">SafeSpace Platform</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Enter email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter password" />
          </div>
          <Button className="w-full bg-teal-600 text-white">Sign In</Button>
        </CardContent>
      </Card>
    </div>
  );
}
