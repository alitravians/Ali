import * as React from "react"
import { useTranslation } from 'react-i18next'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Link } from "react-router-dom"
import { AdminLoginDialog } from "@/components/AdminLoginDialog"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export default function TrendRequestForm() {
  const { t } = useTranslation()
  const [formData, setFormData] = React.useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    picoId: "",
    reason: ""
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState("")

  const sanitizeInput = (input: string) => {
    return input.replace(/[<>]/g, '').trim()
  }

  const validateForm = () => {
    const nameRegex = /^[A-Za-z\s-']+$/
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

    if (!nameRegex.test(formData.firstName) || formData.firstName.length === 0 || formData.firstName.length > 50) {
      setError(t('nameValidationError'))
      return false
    }
    if (!nameRegex.test(formData.lastName) || formData.lastName.length === 0 || formData.lastName.length > 50) {
      setError(t('lastNameValidationError'))
      return false
    }
    if (formData.middleName && (!nameRegex.test(formData.middleName) || formData.middleName.length > 50)) {
      setError(t('middleNameValidationError'))
      return false
    }
    if (!emailRegex.test(formData.email)) {
      setError(t('emailValidationError'))
      return false
    }
    if (!/^[A-Za-z0-9]+$/.test(formData.picoId) || formData.picoId.length > 20) {
      setError(t('picoIdValidationError'))
      return false
    }
    if (formData.reason.length < 10 || formData.reason.length > 1000) {
      setError(t('reasonLengthError'))
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }
    
    try {
      const sanitizedData = {
        first_name: sanitizeInput(formData.firstName),
        middle_name: formData.middleName ? sanitizeInput(formData.middleName) : "",
        last_name: sanitizeInput(formData.lastName),
        email: formData.email.toLowerCase().trim(),
        pico_id: formData.picoId.trim(),
        reason: sanitizeInput(formData.reason)
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/trend-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedData)
      })
      
      if (response.ok) {
        await response.json()
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          picoId: "",
          reason: ""
        })
      } else {
        const data = await response.json()
        setError(data.detail || 'Failed to submit request')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{t('trendRequestTitle')}</CardTitle>
                <CardDescription>{t('trendRequestDescription')}</CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Link to="/trends">
                  <Button variant="outline">{t('viewTrendsButton')}</Button>
                </Link>
                <AdminLoginDialog />
                <LanguageSwitcher />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('firstNameLabel')}</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="middleName">{t('middleNameLabel')}</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName}
                    onChange={(e) => setFormData({...formData, middleName: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastNameLabel')}</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="picoId">{t('picoIdLabel')}</Label>
                <Input
                  id="picoId"
                  value={formData.picoId}
                  onChange={(e) => setFormData({...formData, picoId: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="reason">{t('reasonLabel')}</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                  className="h-32"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? t('submittingText') : t('submitButton')}
              </Button>
              {!error && !isSubmitting && formData.firstName === "" && (
                <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {t('submissionSuccess')}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
