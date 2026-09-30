# LunarSite Compass — Technical Methodology & Mathematical Formulation

## 1. Celestial Geometry at the Lunar South Pole

### 1.1 Solar Vector Formulation
The Moon's rotational axis is tilted by $\epsilon_M = 1.5424^\circ$ relative to the ecliptic plane normal. The sub-solar latitude $\delta_\odot(t)$ (declination of the Sun in the selenographic coordinate frame) undergoes an annual sinusoidal oscillation with a period of one tropical year ($T_{\text{yr}} \approx 365.25\text{ days}$):
$$\delta_\odot(t) = \epsilon_M \sin\left(\frac{2\pi (t - t_0)}{T_{\text{yr}}} + \phi_0\right)$$

The sub-solar longitude $\lambda_\odot(t)$ progresses eastward across the lunar surface at the synodic angular rate $\omega_{\text{syn}} = \frac{2\pi}{P_{\text{syn}}}$, where $P_{\text{syn}} = 29.530588853\text{ days}$:
$$\lambda_\odot(t) = \left(\lambda_0 + \omega_{\text{syn}}(t - t_0)\right) \pmod{360^\circ}$$

For a landing site located at selenographic coordinates $(\phi_{\text{site}}, \lambda_{\text{site}})$, the topocentric solar elevation angle $\alpha_\odot(t)$ is derived from the spherical law of cosines:
$$\sin \alpha_\odot(t) = \sin(\phi_{\text{site}})\sin(\delta_\odot(t)) + \cos(\phi_{\text{site}})\cos(\delta_\odot(t))\cos(\lambda_{\text{site}} - \lambda_\odot(t))$$

The topocentric solar azimuth $\psi_\odot(t)$ measured clockwise from selenographic North ($0^\circ$ to $360^\circ$) satisfies:
$$\tan \psi_\odot(t) = \frac{-\cos(\delta_\odot)\sin(\lambda_{\text{site}} - \lambda_\odot)}{\cos(\phi_{\text{site}})\sin(\delta_\odot) - \sin(\phi_{\text{site}})\cos(\delta_\odot)\cos(\lambda_{\text{site}} - \lambda_\odot)}$$

---

## 2. Terrestrial Vector & Lunar Libration Dynamics

Because the Moon's orbit around Earth has non-zero eccentricity ($e \approx 0.0549$) and non-zero inclination to the ecliptic ($i \approx 5.145^\circ$), an observer on the lunar surface experiences both optical and physical librations. The sub-Earth point $(\delta_\oplus(t), \lambda_\oplus(t))$ oscillates around $(0^\circ, 0^\circ)$:

1. **Libration in Longitude $l(t)$:** Primarily driven by the anomalistic month ($P_{\text{anom}} = 27.554551\text{ days}$):
   $$l(t) = l_{\max} \sin\left(\frac{2\pi t}{P_{\text{anom}}} + \phi_l\right), \quad l_{\max} \approx 7.91^\circ$$

2. **Libration in Latitude $b(t)$:** Governed by the draconic (nodal) month ($P_{\text{drac}} = 27.212220\text{ days}$):
   $$b(t) = b_{\max} \sin\left(\frac{2\pi t}{P_{\text{drac}}} + \phi_b\right), \quad b_{\max} \approx 6.68^\circ$$

The topocentric elevation angle $\alpha_\oplus(t)$ and azimuth $\psi_\oplus(t)$ of Earth from the landing site are computed directly by evaluating the vector to $(b(t), l(t))$.

---

## 3. Spherical Ray-Casting Horizon Masking

Let $z_0$ denote the radial elevation of the landing site relative to the lunar mean sphere ($R_M = 1737.4\text{ km}$). Along any azimuth direction $\theta$, the topography at radial ground distance $r$ has elevation $z(r)$.

Accounting for lunar surface curvature over line-of-sight distances up to $50\text{ km}$:
$$\Delta z_{\text{curvature}}(r) = \frac{r^2}{2 R_M}$$

The apparent elevation angle $\gamma(r, \theta)$ to a terrain obstacle at distance $r$ is:
$$\tan \gamma(r, \theta) = \frac{z(r) - z_0 - \frac{r^2}{2 R_M}}{r}$$

The topographic horizon mask $H(\theta)$ is the supremum over all radial distances:
$$H(\theta) = \sup_{r \in [r_{\min}, r_{\max}]} \arctan\left(\frac{z(r) - z_0 - \frac{r^2}{2 R_M}}{r}\right)$$

---

## 4. Multi-Constraint State Classifier

At every discrete epoch $t_k = t_0 + k \Delta t$:
$$\mathcal{S}_{\text{Sun}}(t_k) = \mathbb{I}\left[\alpha_\odot(t_k) \ge H(\psi_\odot(t_k))\right]$$
$$\mathcal{S}_{\text{Earth}}(t_k) = \mathbb{I}\left[\alpha_\oplus(t_k) \ge H(\psi_\oplus(t_k))\right]$$

Operational state mapping:
$$\text{State}(t_k) = \begin{cases}
\text{Dual Operational (Power + Comm)} & \text{if } \mathcal{S}_{\text{Sun}} = 1 \land \mathcal{S}_{\text{Earth}} = 1 \\
\text{Solar Power Only} & \text{if } \mathcal{S}_{\text{Sun}} = 1 \land \mathcal{S}_{\text{Earth}} = 0 \\
\text{Direct Comm Only (Battery Depletion)} & \text{if } \mathcal{S}_{\text{Sun}} = 0 \land \mathcal{S}_{\text{Earth}} = 1 \\
\text{Mission Blackout} & \text{if } \mathcal{S}_{\text{Sun}} = 0 \land \mathcal{S}_{\text{Earth}} = 0
\end{cases}$$
