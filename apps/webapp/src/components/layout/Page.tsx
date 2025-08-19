import React from 'react';

interface PageProps {
	title?: React.ReactNode;
	description?: React.ReactNode;
	rightSlot?: React.ReactNode;
	maxWidthClassName?: string;
	children: React.ReactNode;
	className?: string;
}

export const Page: React.FC<PageProps> = ({
	title,
	description,
	rightSlot,
	maxWidthClassName = 'max-w-[760px]',
	children,
	className = '',
}) => {
	return (
		<div className={`min-h-screen bg-bg-deep text-foam ${className}`} style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
			{/* Header */}
			{(title || rightSlot) && (
				<div className="bg-steel border-b border-edge/50 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="flex-1 min-w-0">
							{title && (
								<h1 className="font-heading font-semibold text-h2 text-foam truncate">{title}</h1>
							)}
							{description && (
								<p className="text-secondary text-mist truncate">{description}</p>
							)}
						</div>
						{rightSlot && (
							<div className="flex items-center gap-2 ml-4">{rightSlot}</div>
						)}
					</div>
				</div>
			)}

			{/* Main */}
			<div className="p-6 space-y-6 sm:space-y-8">
				<div className={`${maxWidthClassName} mx-auto`}>
					{children}
				</div>
			</div>
		</div>
	);
};

