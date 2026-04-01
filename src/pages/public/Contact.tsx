import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PublicLayout, HeroBanner } from '@/components/layout';
import { Mail, MapPin, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';
import heroContact from '@/assets/heroes/hero-contact.webp';

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

      <div className="container px-4 py-8 sm:py-12">
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Contact Details — shown first on mobile for quick access */}
          <div className="space-y-3 md:order-2">
            <Card className="card-grounded">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{t('contact.emailLabel')}</h3>
                    <a href="mailto:constructivesolutionsibiza@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors break-all">
                      constructivesolutionsibiza@gmail.com
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-grounded">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{t('contact.phoneLabel')}</h3>
                    <a href="tel:+34602403536" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                      +34 602 403 536
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-grounded">
              <CardContent className="p-4 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground text-sm">{t('contact.locationLabel')}</h3>
                    <p className="text-sm text-muted-foreground">{t('contact.locationValue')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="card-grounded md:order-1">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg">{t('contact.formTitle')}</CardTitle>
              <CardDescription className="text-sm">
                {t('contact.formDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t('contact.labelName')}</Label>
                  <Input id="name" placeholder={t('contact.placeholderName')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">{t('contact.labelEmail')}</Label>
                  <Input id="email" type="email" placeholder={t('contact.placeholderEmail')} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">{t('contact.labelSubject')}</Label>
                  <Input id="subject" placeholder={t('contact.placeholderSubject')} required />
                </div>
                <div className="space-y-1.5">
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
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
