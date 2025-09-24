"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CanvasConnectionProps {
  onSave: (settings: CanvasSettings) => void
  initialSettings?: CanvasSettings
}

interface CanvasSettings {
  baseUrl: string
  accessToken: string
}

export function CanvasConnection({ onSave, initialSettings }: CanvasConnectionProps) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<CanvasSettings>(
    initialSettings || {
      baseUrl: "",
      accessToken: "",
    },
  )

  const [showToken, setShowToken] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [hasChanges, setHasChanges] = useState(false)

  const updateSetting = <K extends keyof CanvasSettings>(key: K, value: CanvasSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
    setConnectionStatus("idle")
  }

  const testConnection = async () => {
    if (!settings.baseUrl || !settings.accessToken) {
      toast({
        title: "Missing Information",
        description: "Please provide both Canvas URL and access token",
        variant: "destructive",
      })
      return
    }

    setIsTestingConnection(true)

    // Simulate API call
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simulate success/failure
          if (settings.accessToken.length > 10) {
            resolve(true)
          } else {
            reject(new Error("Invalid token"))
          }
        }, 2000)
      })

      setConnectionStatus("success")
      toast({
        title: "Connection Successful",
        description: "Successfully connected to Canvas LMS",
      })
    } catch (error) {
      setConnectionStatus("error")
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Canvas. Please check your settings.",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleSave = () => {
    onSave(settings)
    setHasChanges(false)
    toast({
      title: "Settings Saved",
      description: "Canvas connection settings have been updated",
    })
  }

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case "success":
        return "Connected"
      case "error":
        return "Connection Failed"
      default:
        return "Not Tested"
    }
  }

  const getStatusVariant = () => {
    switch (connectionStatus) {
      case "success":
        return "default" as const
      case "error":
        return "destructive" as const
      default:
        return "secondary" as const
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-primary" />
            <CardTitle>Canvas Connection</CardTitle>
          </div>
          <Badge variant={getStatusVariant()} className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
        <CardDescription>Configure your Canvas LMS connection for assignment synchronization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Method Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Currently using Personal Access Token authentication. OAuth integration requires admin configuration and
            will be available in future updates.
          </AlertDescription>
        </Alert>

        {/* Canvas Base URL */}
        <div className="space-y-2">
          <Label htmlFor="canvas-url">Canvas Base URL</Label>
          <Input
            id="canvas-url"
            type="url"
            placeholder="https://canvas.university.edu"
            value={settings.baseUrl}
            onChange={(e) => updateSetting("baseUrl", e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            The base URL of your Canvas instance (e.g., https://canvas.university.edu)
          </p>
        </div>

        {/* Personal Access Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="access-token">Personal Access Token</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={() => setShowToken(!showToken)} className="h-6 px-2">
                    {showToken ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showToken ? "Hide" : "Show"} token</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            id="access-token"
            placeholder="Enter your Canvas Personal Access Token..."
            value={settings.accessToken}
            onChange={(e) => updateSetting("accessToken", e.target.value)}
            className={`font-mono text-sm resize-none ${!showToken ? "text-security-disc" : ""}`}
            type={showToken ? "text" : "password"}
            rows={3}
          />
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Generate a Personal Access Token from your Canvas Account Settings
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href={`${settings.baseUrl}/profile/settings`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-2" />
                Open Canvas Settings
              </a>
            </Button>
          </div>
        </div>

        {/* Test Connection */}
        <div className="space-y-4">
          <Button
            onClick={testConnection}
            disabled={isTestingConnection || !settings.baseUrl || !settings.accessToken}
            variant="outline"
            className="w-full sm:w-auto bg-transparent"
          >
            {isTestingConnection ? "Testing Connection..." : "Test Connection"}
          </Button>

          {connectionStatus === "success" && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully connected to Canvas! You can now sync your courses and assignments.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to connect to Canvas. Please verify your URL and access token are correct.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Future OAuth Section */}
        <div className="rounded-lg border border-dashed p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-sm">OAuth Integration</h4>
              <p className="text-sm text-muted-foreground">Connect with Canvas OAuth (Coming Soon)</p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button disabled variant="outline" size="sm">
                    <Info className="h-3 w-3 mr-2" />
                    Connect with Canvas
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>OAuth integration requires admin configuration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="pt-4 border-t">
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Canvas Settings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
