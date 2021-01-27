COPY ..\packages\blueprints-integration\LICENSE .\
COPY ..\packages\blueprints-integration\package.json .\

DEL /S /Q dist
COPY ..\packages\blueprints-integration\dist .\dist
