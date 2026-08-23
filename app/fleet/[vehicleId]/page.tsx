import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { allVehicles, getVehicleById, getVehicleFeatures } from '@/lib/data/vehicles';
import { Button } from '@/components/ui/button';
import { TransitionLink } from '@/components/shared/transition-link';
import {
  ChevronRight,
  ArrowLeft,
  Users,
  Fuel,
  Briefcase,
  Cog,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  MapPin,
  Clock,
  CreditCard,
} from 'lucide-react';

interface VehiclePageProps {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function generateStaticParams() {
  return allVehicles.map((vehicle) => ({
    vehicleId: vehicle.id,
  }));
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { vehicleId } = await params;
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found',
    };
  }

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} Hire Australia`;
  const description = `Hire the ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.category}) in ${vehicle.location}, Australia. From ₹${vehicle.dailyRate}/day. Instant online confirmation.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: vehicle.imageUrl ? [{ url: vehicle.imageUrl }] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { vehicleId } = await params;
  const vehicle = getVehicleById(vehicleId);

  if (!vehicle) {
    notFound();
  }

  const features = getVehicleFeatures(vehicle.features);

  return (
    <main className="min-h-screen bg-background text-foreground pt-24 pb-20 lg:pt-28 lg:pb-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs & Navigation */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TransitionLink href="/" className="hover:text-gold transition-colors">
              Home
            </TransitionLink>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
            <TransitionLink href="/fleet" className="hover:text-gold transition-colors">
              Fleet
            </TransitionLink>
            <ChevronRight className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
            <span className="font-semibold text-foreground" aria-current="page">
              {vehicle.make} {vehicle.model}
            </span>
          </div>

          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex rounded-full">
            <TransitionLink
              href="/fleet"
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Fleet
            </TransitionLink>
          </Button>
        </nav>

        {/* Main Vehicle Detail Hero Card */}
        <div className="overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-card shadow-xl dark:shadow-black/40">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left: Vehicle Image Studio Display */}
            <div className="relative flex flex-col justify-between bg-gradient-to-b from-gray-900 via-midnight to-black p-6 sm:p-8 lg:col-span-7 lg:p-12">
              {/* Badges */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="rounded-full border border-gold/30 bg-gold/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold">
                  {vehicle.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {vehicle.availability}
                </span>
              </div>

              {/* Large Image Showcase */}
              <div className="relative my-8 aspect-[16/10] w-full overflow-hidden rounded-2xl">
                {vehicle.imageUrl ? (
                  <Image
                    src={vehicle.imageUrl}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                    className="object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-800 text-gray-500">
                    Image pending
                  </div>
                )}
              </div>

              {/* Quick Specs Strip */}
              {features && (
                <div className="relative z-10 grid grid-cols-4 gap-2 rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 text-white text-center">
                  <div>
                    <Users className="mx-auto h-4 w-4 text-gold mb-1" />
                    <p className="text-[11px] text-gray-300">Seats</p>
                    <p className="text-sm font-bold">{features.seats}</p>
                  </div>
                  <div>
                    <Cog className="mx-auto h-4 w-4 text-gold mb-1" />
                    <p className="text-[11px] text-gray-300">Gearbox</p>
                    <p className="text-sm font-bold">{features.transmission}</p>
                  </div>
                  <div>
                    <Fuel className="mx-auto h-4 w-4 text-gold mb-1" />
                    <p className="text-[11px] text-gray-300">Fuel</p>
                    <p className="text-sm font-bold">{features.fuelType}</p>
                  </div>
                  <div>
                    <Briefcase className="mx-auto h-4 w-4 text-gold mb-1" />
                    <p className="text-[11px] text-gray-300">Luggage</p>
                    <p className="text-sm font-bold">{features.luggage} Bags</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Booking Summary & Details */}
            <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:p-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  Premium Fleet Australia
                </div>

                <h1 className="mt-2 text-2xl font-display font-bold tracking-tight text-card-foreground sm:text-3xl lg:text-4xl">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>

                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-gold" />
                  <span>Available at {vehicle.location} Airport Hub</span>
                </div>

                {/* Price Display */}
                <div className="mt-6 rounded-2xl bg-muted/50 p-5 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daily Hire Rate</p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-display font-extrabold text-foreground sm:text-4xl">
                      ₹{vehicle.dailyRate}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">INR / day</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Includes GST, standard damage cover, and unlimited kilometres within state.
                  </p>
                </div>

                {/* Key Benefits Included */}
                <div className="mt-6 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Rental Inclusions
                  </p>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Instant booking confirmation</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Free cancellation up to 48 hours prior</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>24/7 National roadside assistance</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Comprehensive vehicle safety inspection</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3 pt-6 border-t border-border">
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full justify-center text-sm font-bold rounded-full shadow-lg shadow-gold/20"
                  asChild
                >
                  <TransitionLink href={`/book/${vehicle.id}`}>
                    <CalendarCheck className="h-4 w-4" />
                    <span>Book This Vehicle Online</span>
                  </TransitionLink>
                </Button>
                <Button variant="outline" size="default" className="w-full justify-center rounded-full text-xs font-semibold" asChild>
                  <TransitionLink href="/fleet">Browse Other Vehicles</TransitionLink>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Specifications & Features Section */}
        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Specifications Card */}
          <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40">
            <h3 className="text-lg font-display font-bold text-card-foreground">
              Vehicle Specifications
            </h3>
            <dl className="mt-4 divide-y divide-border text-sm">
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Make & Model</dt>
                <dd className="font-semibold text-foreground">
                  {vehicle.make} {vehicle.model}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Year</dt>
                <dd className="font-semibold text-foreground">{vehicle.year}</dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-semibold text-foreground">{vehicle.category}</dd>
              </div>
              {features && (
                <>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">Transmission</dt>
                    <dd className="font-semibold text-foreground">{features.transmission}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">Fuel Type</dt>
                    <dd className="font-semibold text-foreground">{features.fuelType}</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">Seating Capacity</dt>
                    <dd className="font-semibold text-foreground">{features.seats} Adults</dd>
                  </div>
                  <div className="flex justify-between py-2.5">
                    <dt className="text-muted-foreground">Luggage Capacity</dt>
                    <dd className="font-semibold text-foreground">{features.luggage} Large Cases</dd>
                  </div>
                </>
              )}
            </dl>
          </div>

          {/* Features & Equipment Card */}
          <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40">
            <h3 className="text-lg font-display font-bold text-card-foreground">Key Features & Tech</h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground font-medium">
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Touchscreen Display with Apple CarPlay / Android Auto</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Integrated Satellite Navigation (GPS)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Reversing Camera & Parking Distance Sensors</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Adaptive Cruise Control & Lane Keep Assist</span>
              </li>
              <li className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-gold flex-shrink-0" />
                <span>Dual-Zone Automatic Climate Control</span>
              </li>
            </ul>
          </div>

          {/* Rental Terms Card */}
          <div className="rounded-3xl border border-border/80 dark:border-white/10 bg-card p-6 shadow-md dark:shadow-black/40">
            <h3 className="text-lg font-display font-bold text-card-foreground">Rental Conditions</h3>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Minimum Age:</strong> 21 years with open driver licence.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CreditCard className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Deposit:</strong> Refundable security bond authorized on credit card upon collection.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-gold flex-shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">Pickup Location:</strong> Available across Sydney, Melbourne, Brisbane, Perth & Gold Coast.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}

