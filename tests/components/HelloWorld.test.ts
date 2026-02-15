import { mount } from '@vue/test-utils'
import HelloWorld from '~/components/HelloWorld.vue'
import { expect, test } from 'vitest'

test('displays message', () => {
  const wrapper = mount(HelloWorld, { props: { msg: 'Hello World' } })
  expect(wrapper.text()).toContain('Hello World')
})
