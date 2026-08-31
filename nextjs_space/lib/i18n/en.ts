import type { LocalizedContent } from './index';

export const en: LocalizedContent = {
  community: {
    healthTips: [
      'Cool burns immediately under running water for 20 minutes',
      'Never apply toothpaste, butter, or ice to burns',
      'Keep wounds clean and covered to prevent infection',
      'Seek medical help for burns larger than your palm',
    ],
    chatQuickPrompts: [
      'How to treat a minor burn at home?',
      'Signs that a wound is infected',
      'When should I go to the hospital for a burn?',
    ],
    articles: {
      filters: {
        all: 'All',
        prevention: 'Prevention',
        wound_care: 'Wound Care',
        nutrition: 'Nutrition',
        infection: 'Infection',
      },
      items: [
        {
          id: '1',
          category: 'prevention',
          title: 'Preventing Burns at Home',
          content: 'Most burns happen at home, especially in the kitchen. Always supervise children around hot surfaces. Keep hot drinks away from table edges. Turn pot handles inward on the stove. Install smoke detectors and keep a fire extinguisher accessible. Never leave cooking unattended. Test bath water temperature before bathing children. Keep lighters and matches out of reach of children.',
        },
        {
          id: '2',
          category: 'wound_care',
          title: 'Proper Wound Care at Home',
          content: 'Proper wound care is essential for healing. Start by washing your hands thoroughly. Clean the wound gently with clean water — avoid using alcohol or hydrogen peroxide as they can damage tissue. Apply a thin layer of antiseptic ointment. Cover with a sterile bandage and change it daily. Keep the wound moist for better healing. Watch for signs of infection: increasing redness, swelling, warmth, pus, or fever. Seek medical attention if the wound is deep, will not stop bleeding, or shows signs of infection.',
        },
        {
          id: '3',
          category: 'nutrition',
          title: 'Nutrition for Wound Healing',
          content: 'Good nutrition is crucial for wound healing. Protein is essential — eat lean meats, fish, eggs, dairy, and legumes. Vitamin C helps produce collagen — eat citrus fruits, strawberries, bell peppers, and broccoli. Zinc supports immune function — found in nuts, seeds, whole grains, and shellfish. Vitamin A promotes skin repair — found in sweet potatoes, carrots, spinach, and liver. Stay well-hydrated by drinking plenty of water. Avoid excessive sugar and processed foods that can impair healing.',
        },
        {
          id: '4',
          category: 'infection',
          title: 'Recognizing Wound Infection',
          content: 'Knowing the signs of wound infection can help you seek timely medical care. Watch for increasing pain around the wound, spreading redness beyond the wound edges, swelling and warmth, yellow or green pus or discharge, a foul smell, red streaks extending from the wound, fever, or chills. If you notice any of these signs, seek medical attention promptly. Do not attempt to drain pus yourself. Keep the wound clean and covered while waiting for medical help.',
        },
        {
          id: '5',
          category: 'prevention',
          title: 'Fire Safety and Emergency Preparedness',
          content: 'Being prepared for fire emergencies can save lives. Install smoke alarms on every level of your home. Create and practise a fire escape plan with your family. Keep fire extinguishers in the kitchen and garage. Know the stop-drop-and-roll technique if clothing catches fire. In case of fire, get out quickly, stay low to avoid smoke, and call 999. Never go back inside a burning building. Keep emergency numbers visible and accessible.',
        },
      ],
    },
    assessment: {
      disclaimer: 'This is a basic self-assessment tool and does not replace professional medical advice. When in doubt, seek medical help.',
      questionLabel: 'Question',
      callEmergency: 'Call 999 Now',
      questions: [
        {
          id: 1,
          text: 'What caused the burn?',
          options: [
            { label: 'Hot liquid (water, oil)', score: 1 },
            { label: 'Fire/Flame', score: 2 },
            { label: 'Chemical', score: 3 },
            { label: 'Electrical', score: 4 },
            { label: 'Sun/Radiation', score: 1 },
          ],
        },
        {
          id: 2,
          text: 'How large is the burned area?',
          options: [
            { label: 'Smaller than a coin', score: 0 },
            { label: 'About the size of your palm', score: 1 },
            { label: 'Larger than your palm', score: 2 },
            { label: 'Covers a large body area (arm, leg, chest)', score: 4 },
          ],
        },
        {
          id: 3,
          text: 'What does the burn look like?',
          options: [
            { label: 'Red, like a sunburn', score: 0 },
            { label: 'Red with blisters', score: 2 },
            { label: 'White, waxy, or charred', score: 4 },
            { label: 'Not sure', score: 2 },
          ],
        },
        {
          id: 4,
          text: 'Rate the pain level (1-10)',
          options: [
            { label: 'Mild (1-3)', score: 0 },
            { label: 'Moderate (4-6)', score: 1 },
            { label: 'Severe (7-9)', score: 2 },
            { label: 'No pain / Numbness (10)', score: 3 },
          ],
        },
      ],
      results: {
        minor: {
          title: 'Minor — Home Care Recommended',
          description: 'This appears to be a minor burn. Apply first aid at home: cool under running water for 20 minutes, apply aloe vera or burn cream, and cover with a clean bandage. Monitor for signs of infection.',
        },
        moderate: {
          title: 'Moderate — Visit a Clinic',
          description: 'This burn may need professional medical attention. Apply first aid, then visit your nearest clinic or hospital for proper assessment and treatment.',
        },
        emergency: {
          title: 'Emergency — Go to Hospital Immediately',
          description: 'This appears to be a serious burn that requires immediate emergency medical attention. Call 999 or go to the nearest Emergency Department immediately. While waiting, cool the burn under running water.',
        },
      },
    },
    firstAidVideo: {
      title: 'First Aid Video',
      introduction: 'Watch a short educational video on immediate first aid for burn injuries.',
      iframeTitle: 'Burn First Aid Educational Video',
      unavailable: 'The first aid video is temporarily unavailable. Please try again later.',
      featuredHeading: 'Featured Video',
      moreVideosHeading: 'More First Aid Videos',
      watchVideo: 'Watch Video',
      keyPointsHeading: 'Burn First Aid',
      keyPoints: [
        {
          strong: 'Cool the burn',
          text: ' with running tap water for ',
          secondaryStrong: '20–30 minutes',
          suffix: '.',
        },
        {
          strong: 'Cover the burn',
          text: ' gently with a clean cloth or dressing.',
        },
        {
          strong: 'Seek medical treatment',
          text: ' when appropriate.',
        },
        {
          strong: 'Do not apply',
          text: ' ice, toothpaste, oil, butter, creams, traditional remedies, or other substances to the burn.',
        },
      ],
      misconceptions: 'Avoid common misconceptions or home remedies that may worsen the injury.',
      reminder: 'Remember: Cool → Cover → Seek Treatment',
      disclaimer: 'This video is for educational purposes only and does not replace professional medical advice, diagnosis, or treatment. Seek appropriate medical care for significant or concerning burn injuries.',
    },
    burnPrevention: {
      title: 'Burn Injury Prevention',
      introduction: 'Practical steps to reduce the risk of burn injuries at home, around children, and in the workplace.',
      categories: [
        {
          id: 'general-public',
          title: 'General Public',
          points: [
            'Recognise common heat, fire, and scald hazards, and keep a safe distance from hot surfaces and open flames.',
            'Handle hot liquids carefully and use appropriate protection when handling hot objects.',
            'Check electrical appliances and cables for obvious damage, and follow equipment and safety instructions.',
            'Use safer practices when handling flammable materials.',
            'Know where emergency exits and basic safety equipment are located where relevant.',
          ],
        },
        {
          id: 'parents-caregivers',
          title: 'Parents & Caregivers',
          points: [
            'Keep hot drinks and liquids away from table edges and keep children away from cooking areas where practical.',
            'Turn pot and pan handles away from accessible edges.',
            'Supervise children around heat, flames, and hot water.',
            'Keep matches and lighters out of reach.',
            'Check bath and washing water temperature before use.',
            'Keep appliance cords where children cannot easily pull them.',
            'Teach age-appropriate burn and fire safety.',
          ],
        },
        {
          id: 'children',
          title: 'Children',
          points: [
            'Do not touch hot surfaces, and stay away from fires and flames.',
            'Ask an adult before handling hot food or drinks.',
            'Do not play with matches or lighters.',
            'Tell an adult if an electrical item looks damaged.',
            'Follow adult instructions in an emergency.',
          ],
        },
        {
          id: 'home-safety',
          title: 'Home / Domestic Safety',
          sections: [
            {
              title: 'Kitchen',
              points: [
                'Handle hot liquids carefully and keep cooking surfaces, pots, pans, and heated appliances safely positioned.',
              ],
            },
            {
              title: 'Bathroom',
              points: [
                'Reduce hot-water exposure and check water temperature before bathing or washing.',
              ],
            },
            {
              title: 'Electrical',
              points: [
                'Do not use damaged cables or plugs, avoid unsafe or overloaded electrical setups, and use appliances as instructed.',
              ],
            },
            {
              title: 'Fire Safety',
              points: [
                'Use smoke or fire detection where appropriate, keep exits accessible, and store ignition sources safely.',
              ],
            },
          ],
        },
        {
          id: 'workplace-safety',
          title: 'Workplace Safety',
          points: [
            'Follow applicable workplace safety procedures and requirements.',
            'Use appropriate personal protective equipment where required.',
            'Identify hot-surface, steam, chemical, and electrical hazards, and follow equipment instructions.',
            'Maintain safe work areas and report damaged equipment or unsafe conditions.',
            'Keep emergency access and equipment unobstructed, and follow workplace emergency procedures.',
            'Receive appropriate training before carrying out hazardous tasks.',
          ],
        },
      ],
      callout: {
        heading: 'If a burn injury occurs',
        text: 'Learn what to do immediately in the First Aid section.',
        button: 'View First Aid',
      },
      disclaimer: 'This information is for general educational purposes. It does not guarantee prevention and does not replace applicable workplace, fire, or building safety requirements.',
    },
    firstAid: {
      stepsLabel: 'Steps',
      guides: [
        {
          id: 'burn',
          title: 'Burn First Aid',
          dos: ['Cool the burn under cool running water for 20 minutes', 'Remove jewellery or clothing near the burn if it is not stuck', 'Cover with cling wrap or a clean, non-fluffy dressing', 'Take pain relief such as paracetamol', 'Seek medical help for large, deep, or facial burns'],
          donts: ['Do not apply ice, butter, toothpaste, or egg whites', 'Do not pop blisters', 'Do not remove clothing stuck to the burn', 'Do not use fluffy cotton or adhesive dressings directly on the burn'],
          steps: ['1. Ensure safety — remove from the heat source', '2. Cool under running water for 20 minutes', '3. Remove jewellery and loose clothing', '4. Cover loosely with cling wrap', '5. Call for help if the burn is severe'],
        },
        {
          id: 'wound',
          title: 'Wound First Aid',
          dos: ['Clean the wound gently with clean water', 'Apply firm pressure with a clean cloth to stop bleeding', 'Apply antiseptic and cover with a sterile bandage', 'Change the dressing daily or when dirty or wet', 'Watch for signs of infection such as redness, swelling, or pus'],
          donts: ['Do not touch the wound with dirty hands', 'Do not use alcohol or hydrogen peroxide on open wounds', 'Do not remove embedded objects from deep wounds', 'Do not pick at scabs'],
          steps: ['1. Wash hands thoroughly', '2. Apply pressure to stop bleeding', '3. Clean the wound under running water', '4. Apply antiseptic cream', '5. Cover with a sterile bandage'],
        },
        {
          id: 'chemical',
          title: 'Chemical Burn First Aid',
          dos: ['Remove contaminated clothing immediately', 'Flush the affected area with large amounts of water for at least 20 minutes', 'Identify the chemical if possible', 'Seek emergency medical attention immediately'],
          donts: ['Do not try to neutralize the chemical', 'Do not apply creams or ointments', 'Do not delay flushing with water'],
          steps: ['1. Ensure your own safety first', '2. Remove contaminated clothing', '3. Flush with water for at least 20 minutes', '4. Call 999 immediately'],
        },
        {
          id: 'electrical',
          title: 'Electrical Burn First Aid',
          dos: ['Ensure the power source is turned off before approaching', 'Call 999 immediately', 'Check for breathing and pulse', 'Cool visible burns with water', 'Treat for shock by laying the person flat and elevating the legs'],
          donts: ['Do not touch the person if still in contact with the electrical source', 'Do not move the person unless there is immediate danger', 'Do not apply ice or ointments'],
          steps: ['1. Disconnect the power source', '2. Call 999', '3. Check breathing', '4. Cool burns with water', '5. Keep the person warm and comfortable'],
        },
        {
          id: 'sunburn',
          title: 'Sunburn First Aid',
          dos: ['Move out of the sun immediately', 'Cool the skin with damp cloths or a cool bath', 'Apply aloe vera or after-sun moisturiser', 'Drink plenty of water', 'Take pain relief such as ibuprofen if needed'],
          donts: ['Do not apply ice directly to sunburn', 'Do not pop sunburn blisters', 'Do not use petroleum jelly on sunburn'],
          steps: ['1. Get out of the sun', '2. Cool the skin gently', '3. Apply moisturiser', '4. Stay hydrated', '5. See a doctor if blistering or fever occurs'],
        },
      ],
    },
  },
  hcp: {
    chatQuickPrompts: ['Calculate TBSA', 'Parkland Formula', 'Burn Management Protocol', 'Wound Assessment'],
    guidelines: {
      referencesLabel: 'References',
      filters: {
        all: 'All',
        burn_care: 'Burn Care',
        wound_care: 'Wound Care',
        infection: 'Infection',
        dressing: 'Dressing',
        surgical: 'Surgical',
      },
      items: [
        {
          id: '1', category: 'burn_care', title: 'Initial Assessment of Burns',
          summary: 'Comprehensive approach to initial burn assessment including TBSA calculation and severity grading.',
          steps: ['Ensure scene safety and remove the patient from the source', 'Primary survey using the ABCDE approach', 'Assess burn depth and calculate TBSA using the Rule of Nines', 'Classify burn severity as minor, moderate, or major', 'Initiate fluid resuscitation for burns above 15% TBSA in adults or 10% in children', 'Assess for inhalation injury', 'Document and photograph injuries'],
          references: ['Malaysian CPG on Management of Burns 2022', 'ISBI Practice Guidelines 2023'],
        },
        {
          id: '2', category: 'burn_care', title: 'Fluid Resuscitation Protocol',
          summary: 'Parkland formula-based fluid management for moderate to severe burns.',
          steps: ['Calculate total fluid using the Parkland Formula: 4 × weight (kg) × TBSA%', 'Give 50% of the total in the first 8 hours from the time of burn', 'Give the remaining 50% over the next 16 hours', "Use Lactated Ringer's Solution", 'Monitor urine output: target 0.5 mL/kg/hr for adults and 1 mL/kg/hr for children', 'Adjust the rate based on urine output', 'Consider colloid after 24 hours'],
          references: ['ATLS 10th Edition', 'Malaysian CPG Burns Management'],
        },
        {
          id: '3', category: 'wound_care', title: 'Wound Bed Preparation (TIME Framework)',
          summary: 'Systematic approach to wound management using the TIME framework.',
          steps: ['T - Tissue: Debride non-viable tissue', 'I - Infection/Inflammation: Manage bioburden and inflammation', 'M - Moisture: Maintain optimal moisture balance', 'E - Edge: Assess for non-advancing or undermined wound edges', 'Reassess the wound at each dressing change', 'Document wound progress using validated assessment tools'],
          references: ['International Wound Journal 2023', 'Malaysian CPG Chronic Wound Management'],
        },
        {
          id: '4', category: 'infection', title: 'Burn Wound Infection Management',
          summary: 'Recognition, prevention, and treatment of burn wound infections.',
          steps: ['Monitor for increased pain, erythema, purulent discharge, and fever', 'Obtain a wound swab for culture and sensitivity before starting antibiotics', 'Apply topical antimicrobials such as Silver Sulfadiazine or Mafenide Acetate', 'Use systemic antibiotics for invasive infections only', 'Inspect and document the wound daily', 'Consider antifungal coverage if broad-spectrum antibiotics are used for more than 7 days'],
          references: ['ABA Practice Guidelines for Burn Care', 'Malaysian Antibiotic Guideline 2022'],
        },
        {
          id: '5', category: 'dressing', title: 'Dressing Selection Guide',
          summary: 'Evidence-based guide for selecting appropriate dressings based on wound characteristics.',
          steps: ['Assess the wound bed: granulating, sloughy, necrotic, or epithelialising', 'Low exudate: Hydrocolloid or Film dressing', 'Moderate exudate: Foam or Hydrofiber dressing', 'High exudate: Alginate or Superabsorbent dressing', 'Infected wounds: Silver-containing dressings or Cadexomer Iodine', 'Burns: Silver-based or Biosynthetic dressings', 'Change the dressing according to manufacturer recommendations or when saturated'],
          references: ['Wounds International Best Practice Statement', 'Malaysian MOH Formulary'],
        },
        {
          id: '6', category: 'surgical', title: 'Surgical Referral Criteria',
          summary: 'Indications for surgical intervention in burn and wound management.',
          steps: ['Full-thickness third- or fourth-degree burns requiring excision and grafting', 'Burns above 20% TBSA in adults or above 10% in children or older adults', 'Burns to the face, hands, feet, perineum, or major joints', 'Circumferential burns requiring escharotomy', 'Electrical or chemical burns with deep tissue involvement', 'Wounds not healing after 3 weeks of appropriate care', 'Wounds with exposed tendon, bone, or joint'],
          references: ['ISBI Guidelines 2023', 'Malaysian CPG Burns Referral Criteria'],
        },
      ],
    },
  },
};
