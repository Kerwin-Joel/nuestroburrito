import { supabase } from '../lib/supabase'
import { FEATURES } from '../lib/constants'
import type { StopReview } from '../types/itinerary'

export const reviewsService = {

    async save(params: {
        userId: string
        spotId: string
        spotName: string
        itineraryId: string
        review: StopReview
    }): Promise<void> {
        if (!FEATURES.REAL_AUTH) {
            console.log('Mock review saved:', params)
            return
        }
        const { error } = await supabase
            .from('spot_reviews')
            .insert({
                user_id: params.userId,
                spot_id: params.spotId,
                spot_name: params.spotName,
                itinerary_id: params.itineraryId,
                rating: params.review.rating,
                liked: params.review.liked,
                improve: params.review.improve,
            })

        if (error) throw error
    },
}