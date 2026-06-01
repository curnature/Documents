# Getting started

::: info
This is a starter page.
:::

## Code

``` bash
echo "hello"
```

## Math Test

## Inline

- Metric: $g_{\mu \nu}$
- Derivative: $\partial_\mu \phi$
- Einstein eq.: $G_{\mu\nu} = 8\pi G\,T_{\mu\nu}$
- FRW: $ds^2=-dt^2+a(t)^2 d\vec{x}^2$

## Display

$$
g_{\mu\nu} = \mathrm{diag}(-1, 1, 1, 1)
$$

$$
\nabla_\mu T^{\mu\nu} = 0
$$

$$
S = \int d^4x\,\sqrt{-g}\left[\frac{R}{16\pi G}-\frac12 g^{\mu\nu}\partial_\mu\phi\,\partial_\nu\phi - V(\phi)\right]
$$

## Aligned equations

$$
\begin{aligned}
H^2 &= \left(\frac{\dot a}{a}\right)^2 = \frac{8\pi G}{3}\rho \\
\dot H &= -4\pi G(\rho + p)
\end{aligned}
$$

## Fractions, roots, sums

$$
\int_0^1 x^2\,dx = \frac{1}{3},\qquad
\sqrt{1+\epsilon}\approx 1+\frac{\epsilon}{2},\qquad
\sum_{n=1}^{\infty}\frac{1}{n^2}=\frac{\pi^2}{6}
$$

## Greek + accents

$$
\alpha,\beta,\gamma,\Gamma,\Lambda,\Omega,\qquad
\dot\phi,\ \ddot\phi,\ \tilde g_{\mu\nu},\ \bar\rho
$$


## text boxes
::: info Definition: Phase Space
A phase space is the set of all possible states of a process or system at a specific time. For a mechanical system with $n$ degrees of freedom, the phase space is typically $2n$-dimensional, parameterized by coordinates and momenta $(q_i, p_i)$.
:::

::: tip Example: Simple Harmonic Oscillator
For a simple 1D harmonic oscillator, the state is determined by its position $x$ and velocity $v$. The phase space is the 2D plane with coordinates $(x, v)$. The system's evolution is described by:
$$ \frac{dx}{dt} = v, \quad \frac{dv}{dt} = -\omega^2 x $$
The phase curves are ellipses centered at the origin.
:::

::: warning Theorem: Liouville's Theorem
For a Hamiltonian system, the phase-space volume is preserved along the flow of the system. If $\rho(q, p, t)$ is the probability density function in phase space, then:
$$ \frac{d\rho}{dt} = \frac{\partial \rho}{\partial t} + \sum_{i=1}^n \left( \frac{\partial \rho}{\partial q_i} \dot{q}_i + \frac{\partial \rho}{\partial p_i} \dot{p}_i \right) = 0 $$
:::

::: danger Important Remark: Singularities
When analyzing phase flows, special care must be taken near equilibrium points where the vector field vanishes (i.e., $v(x) = 0$). Trajectories can take infinite time to reach these critical points.
:::