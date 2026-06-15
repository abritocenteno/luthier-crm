/**
 * Default luthier price list, aligned with gitaarafstellen.nl.
 *
 * Shared by the Settings "Import Pricing Guide" button and the onboarding
 * wizard's services-seeding step so the two never drift apart. Prices are
 * VAT-inclusive (see invoice handling).
 */
export type PricingGuideService = {
    name: string;
    description: string;
    type: "fixed" | "hourly";
    defaultPrice: number;
};

export const PRICING_GUIDE_SERVICES: PricingGuideService[] = [
    // Complete setup
    { name: "Complete Guitar Setup", description: "String change, action, truss rod, pickup height and intonation, electronics check, pot cleaning, fretboard clean & condition, fret polish and body polish.", type: "fixed", defaultPrice: 75 },
    // Setup surcharges
    { name: "12-String / Floyd Rose Surcharge", description: "Additional charge for 12-string or Floyd Rose-style tremolo setups.", type: "fixed", defaultPrice: 10 },
    { name: "Standard Gauge Strings (Acoustic/Electric)", description: "Surcharge for supplied standard gauge acoustic or electric strings.", type: "fixed", defaultPrice: 10 },
    { name: "12-String Strings", description: "Surcharge for a supplied set of 12-string strings.", type: "fixed", defaultPrice: 15 },
    { name: "Bass Strings", description: "Surcharge for a supplied set of bass strings.", type: "fixed", defaultPrice: 20 },
    // Custom maintenance — à la carte
    { name: "Strap Lock Installation", description: "Fit a pair of strap locks.", type: "fixed", defaultPrice: 15 },
    { name: "Output Jack Replacement", description: "Replace the output jack.", type: "fixed", defaultPrice: 25 },
    { name: "Pickup Switch Replacement", description: "Replace the pickup selector switch.", type: "fixed", defaultPrice: 35 },
    { name: "Pickup Replacement (1)", description: "Replace one pickup, labour only.", type: "fixed", defaultPrice: 30 },
    { name: "Pickup Replacement (2)", description: "Replace two pickups, labour only.", type: "fixed", defaultPrice: 55 },
    { name: "Pickup Replacement (3)", description: "Replace three pickups, labour only.", type: "fixed", defaultPrice: 75 },
    { name: "Potentiometer Replacement (1)", description: "Replace one potentiometer.", type: "fixed", defaultPrice: 25 },
    { name: "Potentiometer Replacement (2)", description: "Replace two potentiometers.", type: "fixed", defaultPrice: 45 },
    { name: "Potentiometer Replacement (3)", description: "Replace three potentiometers.", type: "fixed", defaultPrice: 60 },
    { name: "Acoustic Pickup Installation", description: "Install a pickup in an acoustic guitar. From this price.", type: "fixed", defaultPrice: 50 },
    { name: "New Nut (Pre-made)", description: "Supply and fit a pre-made nut.", type: "fixed", defaultPrice: 35 },
    { name: "Custom Bone Nut", description: "Hand-cut and fit a custom bone nut.", type: "fixed", defaultPrice: 55 },
    { name: "Acoustic Bridge Replacement", description: "Replace an acoustic bridge saddle.", type: "fixed", defaultPrice: 25 },
    { name: "Neck Shim Installation", description: "Fit a neck shim to correct neck angle.", type: "fixed", defaultPrice: 25 },
    { name: "Bigsby Tremolo Installation", description: "Install a Bigsby-style tremolo.", type: "fixed", defaultPrice: 45 },
    { name: "Tuning Machine Replacement", description: "Replace a set of tuning machines.", type: "fixed", defaultPrice: 45 },
    { name: "Electronics Shielding (Copper Foil)", description: "Shield the control and pickup cavities with copper foil.", type: "fixed", defaultPrice: 50 },
    { name: "Complete Fret Dressing", description: "Full fret level, crown and polish.", type: "fixed", defaultPrice: 150 },
    { name: "Passive Component Diagnostics", description: "Diagnose passive electronics (pickups, pots, wiring).", type: "fixed", defaultPrice: 25 },
    { name: "General Diagnostics", description: "General fault diagnosis, charged per 15 minutes.", type: "fixed", defaultPrice: 15 },
    { name: "Same-Day Expedited Service", description: "Surcharge for same-day expedited turnaround.", type: "fixed", defaultPrice: 25 },
    { name: "String Replacement (Labour)", description: "String change as a standalone job. Strings not included.", type: "fixed", defaultPrice: 20 },
];
