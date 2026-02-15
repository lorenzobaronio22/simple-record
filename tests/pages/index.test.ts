import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import IndexPage from '~/pages/index.vue'
import { useEvents } from '~/composables/useEvents'

vi.mock('~/composables/useEvents')

describe('IndexPage', () => {
  it('renders the record button and logs link', () => {
    vi.mocked(useEvents).mockReturnValue({
      addEvent: vi.fn(),
      events: ref([]),
      fetchEvents: vi.fn(),
    })
    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    expect(wrapper.find('.record-button').exists()).toBe(true)
    expect(wrapper.find('.record-button').text()).toBe('Record!')
    expect(wrapper.find('.logs-link').exists()).toBe(true)
  })

  it('calls addEvent when the record button is clicked', async () => {
    const addEvent = vi.fn()
    vi.mocked(useEvents).mockReturnValue({
      addEvent,
      events: ref([]),
      fetchEvents: vi.fn(),
    })

    const wrapper = mount(IndexPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    })

    await wrapper.find('.record-button').trigger('click')
    expect(addEvent).toHaveBeenCalledTimes(1)
  })
})
