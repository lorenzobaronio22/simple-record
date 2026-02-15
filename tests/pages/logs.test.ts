import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import LogsPage from '~/pages/logs.vue';
import { useEvents } from '~/composables/useEvents';
import { ref } from 'vue';

vi.mock('~/composables/useEvents');

describe('LogsPage', () => {
  it('renders a list of events', () => {
    const mockEvents = ref([
      { id: 1, type: 'start', timestamp: Date.now() },
      { id: 2, type: 'stop', timestamp: Date.now() + 1000 },
    ]);

    vi.mocked(useEvents).mockReturnValue({
      events: mockEvents,
      fetchEvents: vi.fn(),
      addEvent: vi.fn(),
    });
    const wrapper = mount(LogsPage);

    const listItems = wrapper.findAll('li');
    expect(listItems.length).toBe(2);
    expect(listItems[0].text()).toContain(new Date(mockEvents.value[0].timestamp).toLocaleString());
    expect(listItems[1].text()).toContain(new Date(mockEvents.value[1].timestamp).toLocaleString());
  });

  it('shows a message when there are no events', () => {
    vi.mocked(useEvents).mockReturnValue({
      events: ref([]),
      fetchEvents: vi.fn(),
      addEvent: vi.fn(),
    });

    const wrapper = mount(LogsPage, {
      global: {
        stubs: {
          NuxtLink: true,
        },
      },
    });

    expect(wrapper.find('.no-events').text()).toBe('No events recorded yet.');
  });
});
