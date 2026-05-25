import type { DriveStep } from 'driver.js'

export type TourId = 'map' | 'planning' | 'budget' | 'guide' | 'polls' | 'chat'

const TOURS: Record<TourId, DriveStep[]> = {
  map: [
    {
      element: '[data-tour="map-day-dock"]',
      popover: {
        title: 'Filtre par jour',
        description: 'Sélectionne un jour pour voir uniquement ses spots sur la carte.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="map-transport-toggle"]',
      popover: {
        title: 'Mode de transport',
        description: 'Choisis voiture, marche ou vélo pour voir le trajet réel entre tes spots.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="map-suggest-ai"]',
      popover: {
        title: 'Suggestions IA',
        description: "L'IA te propose des spots selon ta destination et ton type de voyage.",
        side: 'top',
      },
    },
  ],
  planning: [
    {
      element: '[data-tour="planning-timeline"]',
      popover: {
        title: 'Glisse pour réordonner',
        description: 'Maintiens une activité et glisse pour changer l\'ordre. Tu peux aussi la déplacer vers un autre jour.',
        side: 'right',
      },
    },
    {
      element: '[data-tour="planning-import"]',
      popover: {
        title: 'Importer un billet',
        description: 'Prends en photo ton billet d\'avion ou de train — l\'IA extrait les infos et crée l\'activité.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="planning-weekstrip"]',
      popover: {
        title: 'Navigation par jour',
        description: 'Clique sur un jour pour voir ses activités.',
        side: 'bottom',
      },
    },
  ],
  budget: [
    {
      element: '[data-tour="budget-add"]',
      popover: {
        title: 'Ajouter une dépense',
        description: 'Enregistre qui a payé quoi. Tu peux choisir qui participe et même photographier le ticket.',
        side: 'top',
      },
    },
    {
      element: '[data-tour="budget-debts"]',
      popover: {
        title: 'Qui doit quoi ?',
        description: 'Le calcul est automatique. Clique ✓ pour marquer un remboursement comme fait.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="budget-categories"]',
      popover: {
        title: 'Répartition par catégorie',
        description: 'Visualise où part l\'argent du crew.',
        side: 'top',
      },
    },
  ],
  guide: [
    {
      element: '[data-tour="guide-checklist"]',
      popover: {
        title: 'Checklist matos',
        description: 'Coche au fur et à mesure. L\'IA peut générer la liste automatiquement selon ta destination.',
        side: 'bottom',
      },
    },
    {
      element: '[data-tour="guide-checklist-ai"]',
      popover: {
        title: 'Générer avec l\'IA',
        description: 'Un clic et l\'IA crée une checklist adaptée à ton voyage.',
        side: 'top',
      },
    },
  ],
  polls: [
    {
      element: '[data-tour="polls-create"]',
      popover: {
        title: 'Créer un sondage',
        description: 'Pose une question au crew avec 2 à 4 options. Les résultats sont en temps réel.',
        side: 'top',
      },
    },
  ],
  chat: [
    {
      element: '[data-tour="chat-input"]',
      popover: {
        title: 'Chat du crew',
        description: 'Discute avec ton groupe en temps réel. Les messages se synchronisent automatiquement.',
        side: 'top',
      },
    },
  ],
}

export function getTour(id: TourId): DriveStep[] {
  return TOURS[id] ?? []
}
