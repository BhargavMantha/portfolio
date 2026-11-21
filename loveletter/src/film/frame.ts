export type Frame = {
  /** cover: photo fills the view, cropped. contain: lightly cropped photo floating on a blurred surround. */
  mode: 'cover' | 'contain'
  /** Size of the view measured in image widths/heights. >1 means the view is larger than the photo. */
  scale: [number, number]
  /** Image point (0–1, from top-left) shown at the centre of the view. */
  center: [number, number]
}

type Shape = { w: number; h: number; focal: [number, number] }

/** Cropping away more than this share of a photo looks worse than letting it float whole. */
const MAX_CROP = 0.45

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export function frame(photo: Shape, view: { w: number; h: number }): Frame {
  if (!(view.w > 0 && view.h > 0 && photo.w > 0 && photo.h > 0)) {
    return { mode: 'cover', scale: [1, 1], center: [0.5, 0.5] }
  }
  const ratio = photo.w / photo.h / (view.w / view.h)
  // ratio > 1: photo is wider than the view, so cover crops left/right.
  const kept = ratio > 1 ? 1 / ratio : ratio

  if (1 - kept > MAX_CROP) {
    // Crop as much as is allowed around the focal point, then let the photo
    // float: the other axis runs past the image and shows the blurred surround.
    const crop = 1 - MAX_CROP
    const along = clamp(ratio > 1 ? photo.focal[0] : photo.focal[1], crop / 2, 1 - crop / 2)
    return ratio > 1
      ? { mode: 'contain', scale: [crop, crop * ratio], center: [along, 0.5] }
      : { mode: 'contain', scale: [crop / ratio, crop], center: [0.5, along] }
  }

  const scale: [number, number] = ratio > 1 ? [kept, 1] : [1, kept]
  const center: [number, number] = [
    clamp(photo.focal[0], scale[0] / 2, 1 - scale[0] / 2),
    clamp(photo.focal[1], scale[1] / 2, 1 - scale[1] / 2),
  ]
  return { mode: 'cover', scale, center }
}
