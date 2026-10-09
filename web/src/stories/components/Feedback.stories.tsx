import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Disclosure, Icon } from '@/components/ui';

/* How Rotation tells people what happened, what's wrong, and what to do next. */

const stack = { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 640 } as const;

const meta = {
  title: 'Components/Feedback',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The outfit board's live check: incomplete, works, or why it doesn't. */
export const Verdicts: Story = {
  render: () => (
    <div style={stack}>
      <span className="verdict empty">
        <Icon name="info" />
        Add a top, bottom and shoes (or a dress and shoes)
      </span>
      <span className="verdict ok">
        <Icon name="check" />
        These work together
      </span>
      <span className="verdict bad">
        <Icon name="alert" />
        Forest and Burgundy compete for attention
      </span>
      <span className="verdict bad">
        <Icon name="alert" />
        The wool-blend blazer is much dressier than the tapered jogger
      </span>
    </div>
  ),
};

/** Confirmation after an action. In the app it slides up from the bottom and leaves after 2.8 seconds. */
export const Toast: Story = {
  render: () => (
    <div className="toast show" role="status" style={{ position: 'relative', left: 0, bottom: 0, transform: 'none', display: 'inline-flex' }}>
      <Icon name="check" />
      <span>Added to your list · Chino Pants from Uniqlo</span>
    </div>
  ),
};

/** Page-level notices: the demo closet, and status in the sidebar. */
export const Banners: Story = {
  render: () => (
    <div style={stack}>
      <div className="demo-banner" style={{ margin: 0 }}>
        <span>
          <b>You&apos;re exploring Jordan&apos;s demo closet.</b> Changes here aren&apos;t saved.
        </span>
        <a href="#start">Start your own closet →</a>
      </div>
      <div className="banner" style={{ margin: 0 }}>
        <Icon name="unlock" />
        <span className="grow">Three pieces would add 90 outfits to your closet.</span>
      </div>
      <div className="sync-status" style={{ maxWidth: 220 }}>
        <span className="pulse" />
        <span>
          <b>Saved on this device</b>
          <br />
          Nothing leaves your browser
        </span>
      </div>
    </div>
  ),
};

/** Notes inside cards and drawers: nothing yet, a duplicate warning, an error, and where a piece came from. */
export const Notes: Story = {
  render: () => (
    <div style={stack}>
      <p className="empty-note">Add more pieces to see what this goes with.</p>
      <div className="warn-box">
        <b>You already own this:</b> Court Sneakers, worn 64 times.
      </div>
      <p className="error-note">That page could not be read. You can still add it by photo or description.</p>
      <div className="provenance">
        <Icon name="camera" />
        <span>Added from a photo. The background was removed on this device.</span>
      </div>
      <div className="shop-off">
        <Icon name="info" />
        <span>Shopping suggestions are hidden. Only pieces you own are shown.</span>
      </div>
      <div className="processing">
        <span className="spinner" />
        Removing the background…
      </div>
    </div>
  ),
};

/** Shown wherever products are suggested. Explains ranking and money in plain words. */
export const RankingDisclosure: Story = {
  render: () => (
    <div style={{ maxWidth: 640 }}>
      <Disclosure />
    </div>
  ),
};

/** Empty states lead with what to do, not what's missing. */
export const EmptyState: Story = {
  render: () => (
    <div className="card empty" style={{ maxWidth: 640 }}>
      <h2>Your closet is empty</h2>
      <p>Start with what you wear most. A photo on a plain surface works best; the background is removed on your device.</p>
      <button className="btn primary">
        <Icon name="camera" />
        Add your first piece
      </button>
    </div>
  ),
};
