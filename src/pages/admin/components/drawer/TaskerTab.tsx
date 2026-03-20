import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Briefcase, Store, MessageSquare,
  ExternalLink,
} from "lucide-react";
import type { AdminUserDetails, ProServiceEntry, ServiceListingSummary } from "../../queries/adminUserDetails.query";

export function TaskerTab({ user }: { user: AdminUserDetails }) {
  const pro = user.pro!;

  return (
    <div className="space-y-5">
      {/* Profile Summary */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Professional Profile
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <ProfileField label="Display Name" value={pro.display_name ?? "—"} />
          <ProfileField label="Business" value={pro.business_name ?? "—"} />
          <ProfileField label="Verification" value={pro.verification_status} capitalize />
          <ProfileField label="Onboarding" value={pro.onboarding_phase.replace(/_/g, " ")} capitalize />
          <ProfileField label="Listed" value={pro.is_publicly_listed ? "Yes" : "No"} />
          <ProfileField label="Documents" value={String(user.documents_count)} />
        </div>
        {pro.tagline && (
          <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2 mt-2">
            "{pro.tagline}"
          </p>
        )}
        {pro.bio && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{pro.bio}</p>
        )}
      </div>

      {/* Service Zones */}
      {pro.service_zones && pro.service_zones.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> Service Zones
            </h3>
            <div className="flex flex-wrap gap-1">
              {pro.service_zones.map((z) => (
                <Badge key={z} variant="outline" className="text-xs">{z}</Badge>
              ))}
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Activity */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center">
          <MessageSquare className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{user.tasker_conversations_count}</p>
          <p className="text-[10px] text-muted-foreground">Conversations</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Briefcase className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{pro.services_count}</p>
          <p className="text-[10px] text-muted-foreground">Services</p>
        </div>
        <div className="rounded-lg border p-3 text-center">
          <Store className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
          <p className="text-lg font-bold">{user.service_listings.length}</p>
          <p className="text-[10px] text-muted-foreground">Listings</p>
        </div>
      </div>

      <Separator />

      {/* Selected Services */}
      <ServicesSection services={user.pro_services} />

      {/* Service Listings */}
      {user.service_listings.length > 0 && (
        <>
          <Separator />
          <ListingsSection listings={user.service_listings} userId={user.user_id} />
        </>
      )}
    </div>
  );
}

function ProfileField({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`font-medium text-sm ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}

function ServicesSection({ services }: { services: ProServiceEntry[] }) {
  if (services.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" /> Selected Services
        </h3>
        <p className="text-sm text-muted-foreground py-2 text-center">No services selected</p>
      </div>
    );
  }

  const grouped = services.reduce<Record<string, ProServiceEntry[]>>((acc, s) => {
    const key = s.category_name || "Uncategorised";
    (acc[key] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <Briefcase className="h-3.5 w-3.5" /> Selected Services ({services.length})
      </h3>
      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">{cat}</p>
            <div className="flex flex-wrap gap-1">
              {items.map((s) => (
                <Badge key={s.micro_id} variant="outline" className="text-xs">
                  {s.micro_name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListingsSection({ listings, userId }: { listings: ServiceListingSummary[]; userId: string }) {
  const queryClient = useQueryClient();
  const [takedownTarget, setTakedownTarget] = useState<ServiceListingSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleTakedown = async () => {
    if (!takedownTarget) return;
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from("service_listings")
        .update({ status: "draft" })
        .eq("id", takedownTarget.id);
      if (error) throw error;

      // Log admin action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_actions_log").insert({
          admin_user_id: user.id,
          action_type: "listing_takedown",
          target_type: "service_listing",
          target_id: takedownTarget.id,
          metadata: { listing_title: takedownTarget.display_title, provider_id: userId },
        });
      }

      toast.success(`"${takedownTarget.display_title}" taken down to draft`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } catch {
      toast.error("Failed to take down listing");
    } finally {
      setIsProcessing(false);
      setTakedownTarget(null);
    }
  };

  const handleApproveListing = async (listing: ServiceListingSummary) => {
    try {
      const { error } = await supabase
        .from("service_listings")
        .update({ status: "live" })
        .eq("id", listing.id);
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("admin_actions_log").insert({
          admin_user_id: user.id,
          action_type: "listing_approved",
          target_type: "service_listing",
          target_id: listing.id,
          metadata: { listing_title: listing.display_title, provider_id: userId },
        });
      }

      toast.success(`"${listing.display_title}" approved & set live`);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    } catch {
      toast.error("Failed to approve listing");
    }
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Store className="h-3.5 w-3.5" /> Service Listings ({listings.length})
        </h3>
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {listings.map((l) => (
            <div key={l.id} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium truncate">{l.display_title || "Untitled"}</span>
                <Badge
                  variant={l.status === "live" ? "default" : "secondary"}
                  className="text-[10px] capitalize shrink-0"
                >
                  {l.status}
                </Badge>
              </div>
              <div className="flex gap-3 text-[11px] text-muted-foreground">
                <span>{l.has_hero ? "✓ Image" : "✗ No image"}</span>
                <span>{l.has_description ? "✓ Description" : "✗ No desc"}</span>
                <span>{l.pricing_summary ? "✓ Pricing" : "✗ No pricing"}</span>
              </div>
              {/* Admin actions */}
              <div className="flex items-center gap-1.5 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 px-2"
                  onClick={() => window.open(`/services/listing/${l.id}`, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  Review
                </Button>
                {l.status === "live" ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 px-2 text-destructive hover:text-destructive"
                    onClick={() => setTakedownTarget(l)}
                  >
                    <EyeOff className="h-3 w-3" />
                    Take Down
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs gap-1 px-2 text-green-600 hover:text-green-700"
                    onClick={() => handleApproveListing(l)}
                    disabled={!l.has_hero || !l.has_description}
                    title={!l.has_hero || !l.has_description ? "Listing needs image & description before going live" : ""}
                  >
                    <CheckCircle className="h-3 w-3" />
                    Approve
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Takedown confirmation */}
      <AlertDialog open={!!takedownTarget} onOpenChange={(v) => !v && setTakedownTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Take down listing?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will set "{takedownTarget?.display_title}" back to draft, removing it from public view. The professional can re-publish it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTakedown}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? "Taking down…" : "Take Down"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
