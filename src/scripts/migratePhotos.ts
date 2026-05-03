/**
 * migratePhotos.ts
 * Ejecutar: npx tsx src/scripts/migratePhotos.ts
 * 
 * Migra todas las fotos base64 de la tabla spots a Supabase Storage
 * y actualiza photo_url con la URL pública.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nesnupjrguubxwhvqhyk.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lc251cGpyZ3V1Ynh3aHZxaHlrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAxODkzMCwiZXhwIjoyMDkxNTk0OTMwfQ.C-XxASIhfALnQKgAY1zJ7TVJFTrsR6FvRz5Y1a4NGnY' // ← cámbialo por el service role key (NO el anon key)

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const BUCKET = 'spot-photos'

async function ensureBucket() {
    const { data: buckets } = await supabase.storage.listBuckets()
    const exists = buckets?.some(b => b.name === BUCKET)
    if (!exists) {
        const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
        if (error) throw new Error(`Error creando bucket: ${error.message}`)
        console.log(`✓ Bucket '${BUCKET}' creado`)
    } else {
        console.log(`✓ Bucket '${BUCKET}' ya existe`)
    }
}

function base64ToBuffer(base64: string): { buffer: Buffer; mimeType: string } {
    // Extrae el mime type y los datos
    const match = base64.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) throw new Error('Formato base64 inválido')
    const mimeType = match[1]
    const data = match[2]
    return { buffer: Buffer.from(data, 'base64'), mimeType }
}

function mimeToExt(mime: string): string {
    const map: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
    }
    return map[mime] ?? 'jpg'
}

async function migrateSpot(spot: any): Promise<void> {
    const { id, name, photo_url, photos } = spot

    // ── Migrar photo_url principal ──
    let newPhotoUrl = photo_url
    if (photo_url?.startsWith('data:image')) {
        try {
            const { buffer, mimeType } = base64ToBuffer(photo_url)
            const ext = mimeToExt(mimeType)
            const path = `${id}/main.${ext}`

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(path, buffer, {
                    contentType: mimeType,
                    upsert: true,
                })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
            newPhotoUrl = urlData.publicUrl
            console.log(`  ✓ photo_url migrada: ${name}`)
        } catch (e: any) {
            console.error(`  ✗ Error en photo_url de ${name}: ${e.message}`)
        }
    }

    // ── Migrar photos[] ──
    let newPhotos = photos ?? []
    if (Array.isArray(photos) && photos.length > 0) {
        const migratedPhotos: string[] = []
        for (let i = 0; i < photos.length; i++) {
            const p = photos[i]
            if (p?.startsWith('data:image')) {
                try {
                    const { buffer, mimeType } = base64ToBuffer(p)
                    const ext = mimeToExt(mimeType)
                    const path = `${id}/photo_${i}.${ext}`

                    const { error: uploadError } = await supabase.storage
                        .from(BUCKET)
                        .upload(path, buffer, { contentType: mimeType, upsert: true })

                    if (uploadError) throw uploadError

                    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
                    migratedPhotos.push(urlData.publicUrl)
                    console.log(`  ✓ photos[${i}] migrada: ${name}`)
                } catch (e: any) {
                    console.error(`  ✗ Error en photos[${i}] de ${name}: ${e.message}`)
                    migratedPhotos.push(p) // mantener original si falla
                }
            } else {
                migratedPhotos.push(p) // ya es URL, no tocar
            }
        }
        newPhotos = migratedPhotos
    }

    // ── Actualizar en Supabase solo si cambió algo ──
    if (newPhotoUrl !== photo_url || JSON.stringify(newPhotos) !== JSON.stringify(photos)) {
        const { error: updateError } = await supabase
            .from('spots')
            .update({
                photo_url: newPhotoUrl,
                photos: newPhotos,
            })
            .eq('id', id)

        if (updateError) {
            console.error(`  ✗ Error actualizando DB para ${name}: ${updateError.message}`)
        } else {
            console.log(`  ✓ DB actualizada: ${name}`)
        }
    } else {
        console.log(`  — Sin cambios: ${name} (ya tiene URL)`)
    }
}

async function main() {
    console.log('🌯 Burrito — Migración de fotos base64 → Storage\n')

    // 1. Crear bucket si no existe
    await ensureBucket()

    // 2. Leer todos los spots
    const { data: spots, error } = await supabase
        .from('spots')
        .select('id, name, photo_url, photos')
        .order('created_at', { ascending: true })

    if (error) throw new Error(`Error leyendo spots: ${error.message}`)
    if (!spots?.length) { console.log('No hay spots para migrar.'); return }

    console.log(`\n📦 ${spots.length} spots encontrados\n`)

    // 3. Migrar uno por uno
    for (const spot of spots) {
        console.log(`→ ${spot.name} (${spot.id.slice(0, 8)}...)`)
        await migrateSpot(spot)
        // Pequeña pausa para no saturar la API
        await new Promise(r => setTimeout(r, 200))
    }

    console.log('\n✅ Migración completada')
    console.log(`\n💡 Recuerda verificar en Supabase Storage → ${BUCKET} que las fotos estén subidas.`)
    console.log('💡 Si todo se ve bien, puedes limpiar los base64 viejos con:')
    console.log('   UPDATE spots SET photo_url = photo_url WHERE photo_url NOT LIKE \'data:%\';')
}

main().catch(e => {
    console.error('❌ Error fatal:', e.message)
    process.exit(1)
})