# Drone Design Brief: questions that matter

These are the questions a production AeroForge wizard should ask. Keep the initial interaction to 4–6 short questions, then reveal advanced tradeoffs.

## First interaction (must answer)

1. **What will you do with your drone?** Learn to fly / aerial photography / FPV freestyle / outdoor exploration / mapping/research / robotics and onboard AI.
2. **Where and how will you operate?** Indoor / close outdoor / trails and open areas / remote terrain. Ask operating country and planned legal operating purpose. Do not assume permission to follow people or cross restricted airspace.
3. **Experience and workshop capability?** Beginner, FPV pilot, electrical hobbyist, experienced builder. Have a soldering iron and multimeter? Comfortable flashing a flight controller?
4. **All-in budget?** Airframe only versus complete kit including radio, goggles/display, batteries, charger, spares, safety gear, shipping.
5. **Highest priority?** Agility, endurance, image quality, quiet operation, physical resilience, repairability, payload, or portability.
6. **Control style?** Manual LOS RC, FPV RC with spotter, assisted GPS, experimental autonomous within a managed safe test space.

## Advanced (only if relevant)

- Target takeoff mass / 250g constraints; whether approved use of heavier aircraft is acceptable.
- Flight duration and *reserve* requirement; distance/terrain and wind exposure; temperature/elevation.
- Video quality / latency, analog vs digital, recording resolution, camera gimbal needs.
- Onboard payload mass/power and computation envelope (e.g. companion camera, depth sensor, embedded GPU), vibration constraints.
- Planned battery chemistry, field-charge options and safe LiPo handling.
- Access to pilot/spotter, permitted flying areas and local operating conditions.
- Parts repairability, supplier availability and shipping location.

## Recommendations generated from the answers

Return *three architectures* on a Pareto frontier: simplest safe-first concept, balanced concept, and stretch concept, each with 3D layout, quantified constraints, cost including essential support equipment, evidence completeness, and a specific reason for its ranking. Mark any unknown or blocked requirement instead of inventing a compatible part.

## Initial personal build direction

A strong general-purpose learning path would be a small guarded quad for flight skills and an independently engineered 5-inch repairable FPV craft or 7-inch research aircraft. The larger research aircraft is more suitable for integrated sensors and PX4/ArduPilot experiments, but increases cost, risk and compliance requirements. Do not promise safe autonomous trail following or BVLOS flights without permissions, situational awareness and validated failsafes.
