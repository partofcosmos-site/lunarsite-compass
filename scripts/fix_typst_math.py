with open('docs/LUNARSITE_COMPASS_RESEARCH_PAPER.typ', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 303-308 (0-indexed: 303-308) that have LaTeX math remnants
new_lines = {
    303: '+ *Dual-Window Concurrency:* Continuous simultaneous daylight and Earth communications must equal or exceed *10.0 days* ($tau_("dual") >= 240 "h"$).\n',
    304: '+ *Slope Safety Boundary:* Touchdown ellipse 3-sigma terrain slope must not exceed *15.0 degrees* ($theta_("slope") <= 15 degree$).\n',
    305: '+ *Cryogenic Darkness Limit:* Unbroken shadow intervals must remain strictly below *350 hours* ($tau_("dark") < 350 "h"$).\n',
    306: '+ *DSN Direct Line-of-Sight:* Total Direct-to-Earth link duration must exceed *65%* of mission elapsed time.\n',
    307: '+ *ISRU Traversability:* Distance to accessible Permanently Shadowed Region (PSR) cold-trap must be within *5.0 km* across corridors with slope $< 10 degree$.\n',
}

for line_num_0indexed, new_content in new_lines.items():
    old = repr(lines[line_num_0indexed][:60])
    lines[line_num_0indexed] = new_content
    print(f'Line {line_num_0indexed+1}: was {old}')

with open('docs/LUNARSITE_COMPASS_RESEARCH_PAPER.typ', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print(f'Total lines: {len(lines)}. Done.')
