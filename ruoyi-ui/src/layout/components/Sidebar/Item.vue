<template>
  <div>
    <svg-icon v-if="icon" :icon-class="icon" />
    <span v-if="title" slot="title" :title="title.length > 5 ? title : ''">
      {{ title }}
    </span>
  </div>
</template>

<script>
import SvgIcon from '@/components/SvgIcon/index.vue'

export default {
  name: 'MenuItem',
  components: {
    SvgIcon,
  },
  props: {
    icon: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: '',
    },
  },
}
</script>
