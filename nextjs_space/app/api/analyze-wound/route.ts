export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, mimeType } = body ?? {};

    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) {
      console.error('[Phoenix AI] Missing required environment variable ABACUSAI_API_KEY. Set it in .env (see .env.example) before using the AI features.');
      return new Response(JSON.stringify({ error: 'Server configuration error: the AI service credential (ABACUSAI_API_KEY) is not set. See .env.example.' }), { status: 500 });
    }

    const systemPrompt = `You are Phoenix AI, an expert clinical AI assistant specialized in burn AND wound assessment for Malaysian healthcare. Analyze the provided wound/burn image and give a comprehensive, structured clinical assessment. You are competent across the FULL range of wounds, not only burns.

=== 1. NATIVE SKIN TYPE (FITZPATRICK) ===
First, assess the patient's native (unaffected) skin tone using the Fitzpatrick classification (Type I-VI). This is clinically important because erythema, blanching, cyanosis and burn depth signs present very differently on darker skin (Fitzpatrick IV-VI), where redness may appear violaceous, grey or barely visible. Report the estimated Fitzpatrick type and explain how it influences interpretation of this specific wound (e.g. why erythema may be under-appreciated, or how to look for texture/temperature/oedema cues instead of colour on darker skin).

=== 2. WOUND CATEGORY (describe ALL wound types, not just burns) ===
Correctly categorise the wound. It may be any of:
- Burn (thermal, scald, chemical, electrical, flame, friction)
- Acute wound (surgical incision, traumatic laceration, abrasion, puncture, bite, skin tear)
- Chronic wound (present >4-6 weeks or failing to heal: venous leg ulcer, arterial ulcer, diabetic foot ulcer)
- Pressure injury / pressure ulcer — stage it (Stage 1, 2, 3, 4, Unstageable, Deep Tissue Injury)

=== 3. WOUND BED / TISSUE COMPOSITION ===
When describing any non-burn (or mixed) wound, characterise the wound bed using standard wound-care terminology, estimating the approximate proportion of each tissue type present:
- Granulation tissue (healthy red/pink, cobblestone, bleeds easily)
- Epithelialization (new pink/silver migrating epithelium at edges/surface)
- Slough (yellow/tan/grey soft devitalised tissue)
- Eschar / necrotic tissue (black/brown hard or leathery dead tissue)
- Exudate (serous, sanguineous, serosanguineous, purulent) — note amount (none/scant/moderate/heavy) and whether purulent discharge (pus) is present
- Signs of infection or biofilm (erythema, warmth, malodour, increased exudate, pus)
- Wound edges (attached, rolled/epibole, undermined, macerated) and periwound skin
For burns, still describe colour, blistering, capillary refill, sensation and depth indicators.

=== 4. TBSA (burns only) ===
For burn injuries you MUST estimate Total Body Surface Area (TBSA%) from the visible burn area using:
- Rule of Nines (adults): Head 9%, each arm 9%, anterior trunk 18%, posterior trunk 18%, each leg 18%, perineum 1%
- Lund & Browder chart principles for more precise estimation
- Palm method: patient's palm incl. fingers ~1% TBSA
Estimate even if only part of the body is visible; give a small estimate (1-2%) for small burns and a range if uncertain.

You MUST respond in valid JSON with this EXACT structure:
{
  "fitzpatrickType": "Type I / II / III / IV / V / VI with 2-3 word skin-tone label (e.g. 'Type IV - light brown / olive'). Best estimate from visible unaffected skin.",
  "fitzpatrickNote": "how this skin tone affects interpretation of THIS wound (erythema visibility, blanching, depth cues). 1-2 sentences.",
  "woundCategory": "Burn / Acute wound / Chronic wound / Pressure injury (with stage) / Diabetic foot ulcer / Venous ulcer / Arterial ulcer / Surgical wound / Traumatic wound / Other",
  "woundType": "specific type of wound or burn",
  "burnDegree": "1st Degree / 2nd Degree Superficial / 2nd Degree Deep / 3rd Degree / 4th Degree / N/A",
  "severity": "Mild / Moderate / Severe / Critical",
  "characteristics": "detailed description: colour, estimated size, healing stage, signs of infection",
  "tissueComposition": "wound bed description with approximate proportions of granulation, epithelialization, slough, eschar/necrotic tissue. Use 'N/A' only if a clean superficial burn with no wound bed to describe.",
  "exudate": "exudate amount and type (none/scant/moderate/heavy; serous/sanguineous/serosanguineous/purulent), and whether pus/purulent discharge or infection signs are present. Use 'N/A' if not applicable.",
  "woundEdges": "wound edges and periwound skin (attached / rolled / undermined / macerated / callused). Use 'N/A' if not applicable.",
  "confidence": "percentage e.g. 75%",
  "tbsaEstimate": "estimated TBSA percentage as a number (e.g. 15). Use 0 if not a burn injury.",
  "tbsaRange": "estimated range e.g. 12-18%. Use N/A if not a burn.",
  "tbsaBodyRegions": "affected body regions and their individual TBSA contributions, e.g. 'Left forearm (4.5%), Left hand (2.5%)'. Use N/A if not a burn.",
  "tbsaMethod": "Rule of Nines / Lund & Browder / Palm Method / Combined. Use N/A if not a burn.",
  "isBurn": true or false,
  "parklandFluid": "If burn, calculate Parkland formula assuming 70kg adult: 4 x weight(kg) x TBSA%. Show the 24hr total and first 8hr/next 16hr breakdown. Use N/A if not a burn or TBSA is 0.",
  "firstAid": "immediate first aid steps",
  "woundCare": "wound care protocol appropriate to the wound category (e.g. debridement for slough/eschar, moisture balance, offloading for pressure injuries, compression for venous ulcers)",
  "dressing": "dressing recommendations appropriate to the wound bed and exudate level",
  "referral": "referral criteria",
  "followUp": "follow-up schedule"
}

Always include a note that this is for clinical decision support only.
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`;

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please analyze this wound/burn image and provide a structured clinical assessment in JSON format.' },
              { type: 'image_url', image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${image}` } },
            ],
          },
        ],
        stream: true,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response?.ok) {
      const errText = await response?.text?.();
      return new Response(JSON.stringify({ error: `LLM API error: ${errText}` }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialRead = '';

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response?.body?.getReader();
        try {
          while (true) {
            const { done, value } = await (reader?.read() ?? { done: true, value: undefined });
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            let lines = partialRead.split('\n');
            partialRead = lines?.pop() ?? '';
            for (const line of (lines ?? [])) {
              if (line?.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  try {
                    const finalResult = JSON.parse(buffer);
                    const finalData = JSON.stringify({ status: 'completed', result: finalResult });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (e: any) {
                    const finalData = JSON.stringify({ status: 'completed', result: { fitzpatrickType: 'N/A', fitzpatrickNote: 'N/A', woundCategory: 'N/A', woundType: 'Analysis completed', burnDegree: 'N/A', severity: 'See details', characteristics: buffer, tissueComposition: 'N/A', exudate: 'N/A', woundEdges: 'N/A', confidence: 'N/A', tbsaEstimate: '0', tbsaRange: 'N/A', tbsaBodyRegions: 'N/A', tbsaMethod: 'N/A', isBurn: false, parklandFluid: 'N/A', firstAid: 'Consult healthcare professional', woundCare: 'Follow clinical protocols', dressing: 'As advised by HCP', referral: 'If needed', followUp: 'As scheduled' } });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  buffer += parsed?.choices?.[0]?.delta?.content ?? '';
                  const progressData = JSON.stringify({ status: 'processing', message: 'Analyzing' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch (e: any) { /* skip */ }
              }
            }
          }
          // If we get here without [DONE], try to parse what we have
          if (buffer) {
            try {
              const finalResult = JSON.parse(buffer);
              const finalData = JSON.stringify({ status: 'completed', result: finalResult });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            } catch (e: any) {
              const finalData = JSON.stringify({ status: 'completed', result: { fitzpatrickType: 'N/A', fitzpatrickNote: 'N/A', woundCategory: 'N/A', woundType: 'Analysis completed', burnDegree: 'N/A', severity: 'See details', characteristics: buffer, tissueComposition: 'N/A', exudate: 'N/A', woundEdges: 'N/A', confidence: 'N/A', tbsaEstimate: '0', tbsaRange: 'N/A', tbsaBodyRegions: 'N/A', tbsaMethod: 'N/A', isBurn: false, parklandFluid: 'N/A', firstAid: 'Consult healthcare professional', woundCare: 'Follow clinical protocols', dressing: 'As advised by HCP', referral: 'If needed', followUp: 'As scheduled' } });
              controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
            }
          }
        } catch (error: any) {
          console.error('Stream error:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Analyze wound error:', error);
    return new Response(JSON.stringify({ error: error?.message ?? 'Internal error' }), { status: 500 });
  }
}
