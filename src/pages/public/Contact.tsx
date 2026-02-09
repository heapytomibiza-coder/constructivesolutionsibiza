import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Mail, MapPin, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';
import heroContact from '@/assets/heroes/hero-contact.jpg';

/**
 * CONTACT PAGE
 * 
 * Simple contact form + contact details.
 * Construction-grade professional styling.
 */

const Contact = () => {
  const { t } = useTranslation('common');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    toast.success(t('contact.successMessage', 'Message sent! We\'ll get back to you soon.'));
    form.reset();
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <HeroBanner
        imageSrc={heroContact}
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {t('contact.trustBadge')}
          </div>
        }
      />

      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Contact Form */}
          <Card className="card-grounded">
            <CardHeader>
              <CardTitle className="font-display">{t('contact.formTitle')}</CardTitle>
              <CardDescription>
                {t('contact.formDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.labelName')}</Label>
                  <Input id="name" placeholder={t('contact.placeholderName')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.labelEmail')}</Label>
                  <Input id="email" type="email" placeholder={t('contact.placeholderEmail')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.labelSubject')}</Label>
                  <Input id="subject" placeholder={t('contact.placeholderSubject')} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.labelMessage')}</Label>
                  <Textarea 
                    id="message" 
                    placeholder={t('contact.placeholderMessage')}
                    rows={4}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full">
                  {t('contact.sendButton')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Details */}
          <div className="space-y-6">
            <Card className="card-grounded">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.emailLabel')}</h3>
                    <a href="mailto:constructivesolutionsibiza@gmail.com" className="text-muted-foreground hover:text-primary transition-colors">
                      constructivesolutionsibiza@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-grounded">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.phoneLabel')}</h3>
                    <a href="tel:+34602403536" className="text-muted-foreground hover:text-primary transition-colors">
                      +34 602 403 536
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-grounded">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{t('contact.locationLabel')}</h3>
                    <p className="text-muted-foreground">{t('contact.locationValue')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
