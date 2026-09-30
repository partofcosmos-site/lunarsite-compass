# NASA PDS LOLA Polar DEMs & NAIF SPICE Geodetic Engine Specification

## 1. NASA PDS LRO LOLA Products

| Product ID | Latitude Range | Resolution | Grid Size | Sample Type | File Size | Memory Access |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `LDEM_75S_120M` | $75.0^\circ\text{S} \to 90.0^\circ\text{S}$ | $120\text{ m/pix}$ | $7,624 \times 7,624$ | `int16` | $110.8\text{ MB}$ | `np.memmap('<i2')` |
| `LDEM_80S_20M` | $80.0^\circ\text{S} \to 90.0^\circ\text{S}$ | $20\text{ m/pix}$ | $30,400 \times 30,400$ | `int16` | $1.72\text{ GB}$ | `np.memmap('<i2')` |
| `LDEM_875S_5M` | $87.5^\circ\text{S} \to 90.0^\circ\text{S}$ | $5\text{ m/pix}$ | $30,336 \times 30,336$ | `int16` | $1.71\text{ GB}$ | `np.memmap('<i2')` |

### Elevation Decoding Formula
$$\text{Elevation } H\text{ [meters]} = \text{DN} \times 0.5$$
$$\text{Planetary Radius } R\text{ [meters]} = (\text{DN} \times 0.5) + 1,737,400.0$$

---

## 2. Polar Stereographic Forward & Inverse Projection

### Forward: $(\phi, \lambda) \to (I, J)$
$$R_{\text{proj}} = 2 R_{\text{ref}} \tan\left(\frac{90^\circ - |\phi|}{2}\right), \quad R_{\text{ref}} = 1,737,400.0\text{ m}$$
$$X = R_{\text{proj}} \sin(\lambda), \quad Y = R_{\text{proj}} \cos(\lambda)$$
$$I = \text{round}\left(\frac{X}{\text{MAP\_SCALE}} + \frac{N}{2} - 0.5\right)$$
$$J = \text{round}\left(-\frac{Y}{\text{MAP\_SCALE}} + \frac{N}{2} - 0.5\right)$$

---

## 3. NAIF SPICE Kernel Stack & Geodetic Alignment

1. **Planetary Ephemeris:** `de440.bsp` (114 MB, 1550–2650 AD). Includes core-mantle damping.
2. **High-Accuracy Orientation:** `moon_pa_de440_200625.bpc` (12 MB). Eliminates $150\text{ m}$ libration truncation errors present in `IAU_MOON`.
3. **Reference Frame Alignment:**
   - LOLA DEM coordinates are defined in `MOON_ME` (Mean Earth / Polar Axis).
   - Principal Axes (`MOON_PA`) has a constant $0.02886^\circ$ ($875\text{ m}$) offset from `MOON_ME`.
   - Kernels `moon_de440_250416.tf` and `moon_assoc_me.tf` guarantee sub-meter agreement ($53.4\text{ cm}$) between SPICE evaluation and LOLA DEM topography.

---

## 4. Topocentric Vector Evaluation (`azlcpo`)

```python
azlsta, lt = spice.azlcpo(
    method="ELLIPSOID",
    target="SUN",  # or "EARTH"
    et=et,
    abcorr="LT+S",
    azccw=False,   # Clockwise from North
    elplsz=True,   # +Z = Zenith
    obspos=site_cartesian_km,
    obsctr="MOON",
    obsref="MOON_ME"
)
# azlsta[0]: Range (km)
# azlsta[1]: Azimuth (rad)
# azlsta[2]: Elevation (rad)
# azlsta[3..5]: Velocity rates
```
