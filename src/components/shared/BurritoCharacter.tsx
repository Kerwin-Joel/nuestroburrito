/**
 * Espejo de BurritoCharacter.kt (nativo): ahí es un WebView que sirve
 * app/src/main/assets/burrito/ (index.html + burrito.js + three r183 local);
 * acá es el mismo bundle — copiado tal cual a public/burrito/ — en un
 * iframe, para que el modelo, las animaciones y las expresiones sean
 * exactamente las mismas en los dos lados, no una reconstrucción aparte.
 */
interface Props {
  /** B = Burrito Chevy (cría, chibi). C = Burrito (aventurero, con alforjas). */
  variant?: 'B' | 'C'
  /** Una acción ("sleep") o una secuencia ("wave,idle") — la última se repite. */
  action?: string
  className?: string
  style?: React.CSSProperties
}

export default function BurritoCharacter({ variant = 'B', action = 'idle', className, style }: Props) {
  const src = `/burrito/index.html?v=${variant}&a=${encodeURIComponent(action)}`
  return (
    <iframe
      key={`${variant}-${action}`}
      src={src}
      title="Burrito"
      className={className}
      style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', ...style }}
      // El iframe no necesita red ni scripts de la página padre — solo su propio Three.js.
      sandbox="allow-scripts allow-same-origin"
    />
  )
}
